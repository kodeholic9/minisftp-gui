// miniSFTP GUI - Tauri Backend
// author: kodeholic (powered by Claude)

use minisftp_core::sftp::SftpClient;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;

pub mod commands;

/// 전역 SFTP 세션 상태
pub struct SftpState(pub Mutex<Option<SftpClient>>);

/// 전송 취소 토큰
pub struct CancelState(pub Mutex<Option<CancellationToken>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .manage(SftpState(Mutex::new(None)))
        .manage(CancelState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::connect::cmd_connect,
            commands::connect::cmd_disconnect,
            commands::fs::cmd_ls,
            commands::fs::cmd_mkdir,
            commands::fs::cmd_rm,
            commands::transfer::cmd_get,
            commands::transfer::cmd_put,
            commands::transfer::cmd_cancel_transfer,
            commands::local::cmd_local_drives,
            commands::local::cmd_local_ls,
            commands::local::cmd_local_resolve,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
