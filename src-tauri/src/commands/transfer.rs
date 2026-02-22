// miniSFTP GUI - Transfer Commands
// author: kodeholic (powered by Claude)

use minisftp_core::sftp::TransferResult;
use serde::Serialize;
use tauri::Emitter;
use tauri::State;
use tokio_util::sync::CancellationToken;

use crate::{CancelState, SftpState};

#[derive(Serialize, Clone)]
pub struct ProgressDto {
    pub transferred: u64,
    pub total: u64,
    pub ratio: f64,
    pub speed: u64,
}

fn transfer_result_to_str(r: TransferResult) -> String {
    match r {
        TransferResult::Completed(n)  => format!("Completed({})", n),
        TransferResult::Resumed(n)    => format!("Resumed({})", n),
        TransferResult::Skipped       => "Skipped".to_string(),
        TransferResult::Cancelled(n)  => format!("Cancelled({})", n),
    }
}

#[tauri::command]
pub async fn cmd_get(
    state:  State<'_, SftpState>,
    cancel: State<'_, CancelState>,
    window: tauri::Window,
    remote: String,
    local:  String,
) -> Result<String, String> {
    // 새 토큰 발급
    let token = CancellationToken::new();
    *cancel.0.lock().await = Some(token.clone());

    let mut guard = state.0.lock().await;
    let sftp = guard.as_mut().ok_or("Not connected")?;

    let win = window.clone();
    let result = sftp
        .get(&remote, &local, move |p| {
            win.emit("sftp:progress", ProgressDto {
                transferred: p.transferred,
                total:       p.total,
                ratio:       p.ratio(),
                speed:       p.speed(),
            }).ok();
        }, token)
        .await
        .map_err(|e| e.to_string())?;

    *cancel.0.lock().await = None;
    Ok(transfer_result_to_str(result))
}

#[tauri::command]
pub async fn cmd_put(
    state:  State<'_, SftpState>,
    cancel: State<'_, CancelState>,
    window: tauri::Window,
    local:  String,
    remote: String,
) -> Result<String, String> {
    // 새 토큰 발급
    let token = CancellationToken::new();
    *cancel.0.lock().await = Some(token.clone());

    let mut guard = state.0.lock().await;
    let sftp = guard.as_mut().ok_or("Not connected")?;

    let win = window.clone();
    let result = sftp
        .put(&local, &remote, move |p| {
            win.emit("sftp:progress", ProgressDto {
                transferred: p.transferred,
                total:       p.total,
                ratio:       p.ratio(),
                speed:       p.speed(),
            }).ok();
        }, token)
        .await
        .map_err(|e| e.to_string())?;

    *cancel.0.lock().await = None;
    Ok(transfer_result_to_str(result))
}

#[tauri::command]
pub async fn cmd_cancel_transfer(cancel: State<'_, CancelState>) -> Result<(), String> {
    if let Some(token) = cancel.0.lock().await.as_ref() {
        token.cancel();
    }
    Ok(())
}
