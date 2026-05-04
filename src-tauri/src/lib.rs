use tauri::{
    Manager, WindowBuilder, WindowUrl,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let win = app.get_webview_window("main").unwrap();

            // Always on top — the core PinNote feature
            win.set_always_on_top(true)?;

            // Build system tray
            let quit = MenuItemBuilder::with_id("quit", "退出 PinNote").build(app)?;
            let show = MenuItemBuilder::with_id("show", "显示 / 隐藏").build(app)?;
            let always_on_top_on  = MenuItemBuilder::with_id("aot_on",  "始终置顶 ✓").build(app)?;
            let always_on_top_off = MenuItemBuilder::with_id("aot_off", "取消置顶").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&show, &always_on_top_on, &always_on_top_off, &quit])
                .build()?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                    "aot_on" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.set_always_on_top(true);
                        }
                    }
                    "aot_off" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.set_always_on_top(false);
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running PinNote");
}
