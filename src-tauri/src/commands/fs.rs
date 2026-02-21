// miniSFTP GUI - Filesystem Commands
// author: kodeholic (powered by Claude)

use serde::Serialize;
use tauri::State;

use crate::SftpState;

#[derive(Serialize)]
pub struct FileEntryDto {
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub permission: String,
    pub mtime: String,
}

#[tauri::command]
pub async fn cmd_ls(
    state: State<'_, SftpState>,
    path: String,
) -> Result<Vec<FileEntryDto>, String> {
    let mut guard = state.0.lock().await;
    let sftp = guard.as_mut().ok_or("Not connected")?;

    let entries = sftp.ls(&path).await.map_err(|e| e.to_string())?;

    Ok(entries
        .iter()
        .map(|e| FileEntryDto {
            name: e.name.clone(),
            size: e.size,
            is_dir: e.is_dir,
            permission: e.permission_str(),
            mtime: e.mtime_str(),
        })
        .collect())
}

#[tauri::command]
pub async fn cmd_mkdir(state: State<'_, SftpState>, path: String) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    let sftp = guard.as_mut().ok_or("Not connected")?;
    sftp.mkdir(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_rm(state: State<'_, SftpState>, path: String) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    let sftp = guard.as_mut().ok_or("Not connected")?;
    sftp.rm(&path).await.map_err(|e| e.to_string())
}
