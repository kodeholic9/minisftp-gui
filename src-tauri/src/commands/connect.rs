// miniSFTP GUI - Connect Commands
// author: kodeholic (powered by Claude)

use minisftp_core::config::{AuthMethod, ConnectConfig};
use minisftp_core::session::SftpSession;
use minisftp_core::state::{ConnectionObserver, ConnectionState};
use tauri::Emitter;
use tauri::State;

use crate::SftpState;

struct TauriObserver(tauri::Window);

impl ConnectionObserver for TauriObserver {
    fn on_state_changed(&self, _prev: &ConnectionState, next: &ConnectionState) {
        self.0.emit("sftp:state", format!("{:?}", next)).ok();
    }
}

#[tauri::command]
pub async fn cmd_connect(
    state: State<'_, SftpState>,
    window: tauri::Window,
    host: String,
    port: u16,
    username: String,
    password: String,
) -> Result<String, String> {
    let config = ConnectConfig {
        host,
        port,
        username: username.clone(),
        auth: AuthMethod::Password(password),
    };

    let mut session = SftpSession::new(Box::new(TauriObserver(window)));
    let sftp = session.connect(&config).await.map_err(|e| e.to_string())?;

    *state.0.lock().await = Some(sftp);

    // 홈 디렉토리 추정: root면 /root, 아니면 /home/username
    let home = if username == "root" {
        "/root".to_string()
    } else {
        format!("/home/{}", username)
    };

    Ok(home)
}

#[tauri::command]
pub async fn cmd_disconnect(state: State<'_, SftpState>) -> Result<(), String> {
    *state.0.lock().await = None;
    Ok(())
}
