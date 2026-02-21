// miniSFTP GUI - Local Filesystem Commands
// author: kodeholic (powered by Claude)
//
// 로컬 파일시스템 접근은 minisftp-core의 utils를 통해 수행
// std::fs 직접 접근 금지 → 플랫폼 독립성은 core에서 보장

use minisftp_core::utils::{local_ls, resolve_local_path};
use serde::Serialize;

#[derive(Serialize)]
pub struct LocalEntry {
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub permission: String,
    pub mtime: String,
}

/// Windows: A: ~ Z: 드라이브 존재 여부 탐색
/// Unix: ["/"] 반환
#[tauri::command]
pub fn cmd_local_drives() -> Vec<String> {
    #[cfg(windows)]
    {
        (b'A'..=b'Z')
            .map(|c| format!("{}:", c as char))
            .filter(|d| std::fs::metadata(format!("{}\\", d)).is_ok())
            .collect()
    }
    #[cfg(not(windows))]
    {
        vec!["/".to_string()]
    }
}

/// 로컬 디렉토리 목록 — minisftp-core::utils::local_ls 위임
#[tauri::command]
pub fn cmd_local_ls(path: String) -> Result<Vec<LocalEntry>, String> {
    let entries = local_ls(&path).map_err(|e| e.to_string())?;

    Ok(entries
        .iter()
        .map(|e| LocalEntry {
            name: e.name.clone(),
            size: e.size,
            is_dir: e.is_dir,
            permission: e.permission_str(),
            mtime: e.mtime_str(),
        })
        .collect())
}

/// 로컬 경로 resolve — minisftp-core::utils::resolve_local_path 위임
#[tauri::command]
pub fn cmd_local_resolve(base: String, path: String) -> String {
    resolve_local_path(&base, &path)
}
