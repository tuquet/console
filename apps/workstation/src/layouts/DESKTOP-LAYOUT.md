# Desktop titlebar and application header

`App` owns one `DesktopShell` in Tauri. Web browsers render the router directly.
The shell persists across navigation, including authentication and error pages.

The two regions have different owners:

- `window-titlebar`: app identity, native drag region, minimize, maximize/restore,
  and close. `DesktopTitlebar` composes the shared `WindowControls`.
- `header`: the application header and tabbar in `vben-layout.vue`. The header
  contains the sidebar toggle, optional logo/workspace selector, breadcrumb,
  navigation menu, configured widgets and user dropdown. Widget visibility,
  placement and order depend on preferences. Supported widgets include refresh,
  search, preferences, theme, language, timezone, fullscreen, notifications,
  lock and logout. Header-left/right slots supply custom content.

The titlebar is a normal flex row. `desktop-viewport` fills the remaining height
with `min-height: 0`. CSS `contain: layout` makes that region the containing
block for fixed headers, sidebars, footer and masks. They keep their existing
coordinates without adding titlebar offsets to each layout dependency.

`useElementSize` observes the available content height and supplies the existing
`--vben-viewport-height` variable within this region. Overlay sizing therefore
uses the space below the titlebar. Changing titlebar height requires no changes
to page padding or margins. Body-teleported dialogs remain window-level overlays.

Dragging belongs to the titlebar, not the application header. Tauri handles
dragging and double-click maximize on `data-tauri-drag-region`. Window buttons
are outside the draggable elements. Their maximize icon refreshes on resize.

References:

- [Tauri window customization](https://v2.tauri.app/learn/window-customization/)
- [CSS layout containment](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Using)

Manual desktop checks: navigate between dashboard and login; collapse the sidebar;
switch layout modes; scroll with fixed and auto-hidden headers; open overlays;
resize, minimize, maximize, restore and close. Verify that the titlebar appears
once, the application header starts below it, and bottom content stays visible.
