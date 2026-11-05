use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_window_state::StateFlags;

mod tray;

/// Resolves the canonical Operon log file (~/.operon/logs/workstation.log)
pub fn get_workstation_log_path() -> std::path::PathBuf {
    let base = std::env::var("DATA_DIR")
        .ok()
        .filter(|d| !d.trim().is_empty())
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| {
            let home = std::env::var("USERPROFILE")
                .or_else(|_| std::env::var("HOME"))
                .unwrap_or_else(|_| ".".to_string());
            std::path::PathBuf::from(home).join(".operon")
        });
    base.join("logs").join("workstation.log")
}

/// Appends a structured timestamped entry to workstation.log
pub fn log_to_file(level: &str, message: &str) {
    let log_path = get_workstation_log_path();
    if let Some(parent) = log_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S%.3f");
    let line = format!("[{}] [{}] {}\n", now, level.to_uppercase(), message);
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        let _ = file.write_all(line.as_bytes());
    }
}

/// Tracks whether Tauri owns the in-process daemon or is attached to an external CLI daemon
#[derive(Clone)]
pub struct DaemonOwnership {
    pub is_embedded: Arc<AtomicBool>,
}

#[tauri::command]
async fn get_app_environment(app: AppHandle) -> Result<serde_json::Value, String> {
    let package_info = app.package_info();
    let log_path = get_workstation_log_path().to_string_lossy().to_string();
    Ok(serde_json::json!({
        "appName": package_info.name,
        "version": package_info.version.to_string(),
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "logPath": log_path,
    }))
}

#[tauri::command]
async fn show_main_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())
}

#[tauri::command]
async fn toggle_devtools(window: tauri::WebviewWindow) -> Result<bool, String> {
    if window.is_devtools_open() {
        window.close_devtools();
        log_to_file("DEBUG", "DevTools closed by user");
        Ok(false)
    } else {
        window.open_devtools();
        log_to_file("DEBUG", "DevTools opened by user");
        Ok(true)
    }
}

#[tauri::command]
async fn open_devtools(window: tauri::WebviewWindow) -> Result<(), String> {
    window.open_devtools();
    log_to_file("DEBUG", "DevTools opened by user");
    Ok(())
}

#[tauri::command]
async fn get_log_path() -> Result<String, String> {
    Ok(get_workstation_log_path().to_string_lossy().to_string())
}

#[tauri::command]
async fn append_log(level: String, message: String) -> Result<(), String> {
    log_to_file(&level, &message);
    Ok(())
}

/// Spawns the embedded Operon Daemon API in the background if port 8765 is not already active
fn spawn_embedded_daemon_if_needed(ownership: DaemonOwnership) {
    tauri::async_runtime::spawn(async move {
        let daemon_port: u16 = 8765;
        let health_url = format!("http://127.0.0.1:{}/api/v1/health", daemon_port);

        // Probe port 8765 first with 800ms timeout
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_millis(800))
            .build();

        let already_running = if let Ok(cli) = client {
            match cli.get(&health_url).send().await {
                Ok(resp) => resp.status().is_success(),
                Err(_) => false,
            }
        } else {
            false
        };

        if already_running {
            let msg = format!("Active Daemon detected on 127.0.0.1:{}. Attaching as client (external ownership).", daemon_port);
            println!("[tauri::daemon] {}", msg);
            log_to_file("INFO", &format!("[daemon] {}", msg));
            ownership.is_embedded.store(false, Ordering::SeqCst);
        } else {
            let msg = format!("Spawning in-process Daemon API on 127.0.0.1:{}...", daemon_port);
            println!("[tauri::daemon] {}", msg);
            log_to_file("INFO", &format!("[daemon] {}", msg));
            ownership.is_embedded.store(true, Ordering::SeqCst);
            // Run server in-process (detach=false, cloud=false, claim=false)
            if let Err(e) = operon::commands::worker::supervisor::run_server(
                Some("127.0.0.1".into()),
                Some(daemon_port),
                false,
                None,
                None,
                false,
                false,
            )
            .await
            {
                let err_msg = format!("Embedded daemon server exited: {}", e);
                eprintln!("[tauri::daemon] {}", err_msg);
                log_to_file("ERROR", &format!("[daemon] {}", err_msg));
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ownership = DaemonOwnership {
        is_embedded: Arc::new(AtomicBool::new(false)),
    };
    let ownership_shutdown = ownership.clone();

    let app = tauri::Builder::default()
        .manage(ownership.clone())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(StateFlags::all())
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            // If single-instance receives deep-link URL on secondary launch
            for arg in args {
                if arg.starts_with("operon://") {
                    let _ = app.emit("deep-link-received", arg);
                }
            }
        }))
        .invoke_handler(tauri::generate_handler![
            get_app_environment,
            show_main_window,
            toggle_devtools,
            open_devtools,
            get_log_path,
            append_log
        ])
        .setup(move |app| {
            let log_path = get_workstation_log_path();
            log_to_file("INFO", &format!("Operon v{} starting on {} ({})",
                app.package_info().version, std::env::consts::OS, std::env::consts::ARCH));
            log_to_file("INFO", &format!("Log sink initialized at: {}", log_path.display()));

            // Setup system tray
            let _ = tray::setup_tray(app.handle());

            // Auto-start or attach to embedded Daemon API on port 8765
            spawn_embedded_daemon_if_needed(ownership);

            // Build main window with strict navigation security guard
            let app_handle = app.handle().clone();
            let _window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::default(),
            )
            .title("Operon")
            .inner_size(1440.0, 900.0)
            .min_inner_size(1024.0, 700.0)
            .resizable(true)
            .center()
            .decorations(false)
            .shadow(true)
            .visible(true)
            .on_navigation(move |url| {
                let scheme = url.scheme();
                let host = url.host_str().unwrap_or("");
                log_to_file("DEBUG", &format!("[navigation] url={} scheme={} host={}", url.as_str(), scheme, host));

                // Allow internal browser pseudoprotocols & resource schemes (about:blank, data:, blob:)
                if scheme == "about" || scheme == "data" || scheme == "blob" || scheme == "javascript" {
                    return true;
                }

                // Allow internal app pages, loopback, or custom tauri/asset schemes
                if scheme == "tauri"
                    || scheme == "asset"
                    || host == "localhost"
                    || host == "tauri.localhost"
                    || host.ends_with(".localhost")
                    || host == "127.0.0.1"
                {
                    return true;
                }

                // Intercept and open external HTTP/HTTPS/mailto links in default system browser
                if scheme == "http" || scheme == "https" || scheme == "mailto" {
                    log_to_file("INFO", &format!("[navigation] Opening external link in system browser: {}", url.as_str()));
                    use tauri_plugin_opener::OpenerExt;
                    let _ = app_handle.opener().open_url(url.as_str(), None::<&str>);
                }
                false
            })
            .build()?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building opn admin tauri application");

    app.run(move |_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            log_to_file("INFO", "Operon exit requested, cleaning up...");
            let is_embedded = ownership_shutdown.is_embedded.load(Ordering::SeqCst);
            if is_embedded {
                println!("[tauri::shutdown] Desktop app exiting (Embedded Daemon Owner). Reaping child browser and daemon resources...");
                log_to_file("INFO", "[daemon] Stopping in-process daemon...");
                tauri::async_runtime::block_on(async {
                    let _ = operon::commands::worker::supervisor::stop_daemon(true).await;
                });
            } else {
                println!("[tauri::shutdown] Desktop app exiting in Client Mode. External CLI Daemon remains intact.");
                log_to_file("INFO", "[daemon] External CLI daemon remains intact.");
            }
        }
    });
}
