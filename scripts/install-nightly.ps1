# Operon Workstation - Automated Nightly Test Installer
# Usage in Windows PowerShell:
#   irm https://raw.githubusercontent.com/tuquet/console/main/scripts/install-nightly.ps1 | iex

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$url = "https://github.com/tuquet/console/releases/download/nightly/Operon-Workstation-Setup.exe"
$out = "$env:TEMP\Operon-Workstation-Setup.exe"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      Operon Workstation - Nightly Test Setup     " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Downloading latest nightly installer..." -ForegroundColor Yellow

try {
    $wc = New-Object System.Net.WebClient
    $wc.DownloadFile($url, $out)
    $sizeMb = ([System.IO.FileInfo]$out).Length / 1MB
    Write-Host ("Downloaded: {0:N2} MB to {1}" -f $sizeMb, $out) -ForegroundColor Green
    Write-Host "Launching installer (CurrentUser mode, no Admin required)..." -ForegroundColor Green
    Start-Process -FilePath $out
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host "Please download manually at: $url" -ForegroundColor Yellow
}
