use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AppStatus {
    pub name: String,
    pub version: String,
    pub status: String,
}

pub mod commands {
    use super::*;

    #[tauri::command]
    pub fn get_app_status() -> AppStatus {
        AppStatus {
            name: "MyuJiku".to_string(),
            version: "2.0.0".to_string(),
            status: "active".to_string(),
        }
    }

    #[tauri::command]
    pub fn greet(name: &str) -> String {
        format!("Hello, {}! Welcome to MyuJiku v2.", name)
    }

    #[tauri::command]
    pub fn check_ytdlp_status() -> serde_json::Value {
        serde_json::json!({
            "installed": false,
            "version": null,
            "channel": "stable",
            "cache_cap_mb": 500,
        })
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_app_status,
            commands::greet,
            commands::check_ytdlp_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
