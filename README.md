# miniSFTP GUI

A lightweight, cross-platform SFTP client built with [Tauri](https://tauri.app/) + Vue 3 + TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2.x-brightgreen)
![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen)

## Features

- 🔌 **Session management** — Save, edit, delete SFTP sessions with one-click connect
- 📁 **Dual-pane browser** — Local and remote filesystem side by side
- ⬇️ **Download / ⬆️ Upload** — Right-click context menu with real-time progress
- ↩️ **Resume support** — Interrupted transfers resume automatically (via [minisftp-core](https://crates.io/crates/minisftp-core))
- ❌ **Cancel transfer** — Stop in-progress transfers
- 🗑️ **Remote file delete** — With confirmation dialog
- 📝 **Live logs** — Connection state and transfer history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2.x](https://tauri.app/) |
| Frontend | Vue 3 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Pinia |
| Icons | Lucide Vue Next |
| SFTP Core | [minisftp-core](https://crates.io/crates/minisftp-core) (Rust) |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.70+
- [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/)

## Getting Started

```bash
# Clone
git clone https://github.com/kodeholic9/minisftp-gui.git
cd minisftp-gui

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Project Structure

```
minisftp-gui/
├── src/                        # Vue 3 frontend
│   ├── components/
│   │   ├── NavBar.vue          # Session selector + connection bar
│   │   ├── LocalPane.vue       # Local filesystem browser
│   │   ├── RemotePane.vue      # Remote SFTP browser
│   │   ├── BottomPane.vue      # Logs + transfer progress
│   │   ├── SessionModal.vue    # Add / edit session dialog
│   │   └── ConfirmDialog.vue   # Reusable confirm dialog
│   └── stores/
│       ├── sftp.ts             # SFTP connection & file state
│       ├── local.ts            # Local filesystem state
│       └── sessions.ts         # Persistent session storage
└── src-tauri/                  # Rust backend
    └── src/
        ├── commands/
        │   ├── connect.rs      # cmd_connect, cmd_disconnect
        │   ├── fs.rs           # cmd_ls, cmd_mkdir, cmd_rm
        │   ├── transfer.rs     # cmd_get, cmd_put, cmd_cancel_transfer
        │   └── local.rs        # cmd_local_drives, cmd_local_ls
        └── lib.rs              # App setup, global state
```

## Known Limitations

- Password stored in plain text (`sessions.json`) — OS keychain encryption planned
- Transfer cancel stops progress reporting but underlying IO completes
- Home directory detection is heuristic (`/home/<user>` or `/root`)

## Roadmap

- [ ] OS keychain integration for password storage
- [ ] Folder delete (recursive)
- [ ] Drag & drop between panes
- [ ] SSH key authentication
- [ ] Bookmarks / favorites

## License

MIT © 2025 kodeholic
