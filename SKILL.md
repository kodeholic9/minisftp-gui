---
name: minisftp-gui
description: miniSFTP GUI 프로젝트 작업 컨텍스트. Tauri 2.x + Vue 3 + TypeScript + Rust로 만든 SFTP 클라이언트 GUI 개발 시 반드시 이 SKILL을 참조할 것. 사용자가 miniSFTP, minisftp-gui, SFTP 클라이언트 GUI, Tauri SFTP, 전송 취소, 세션 관리, 로컬/리모트 파일 브라우저 등을 언급하면 즉시 이 SKILL을 로드할 것.
---

# miniSFTP GUI 프로젝트

## 핵심 정보

- **작업 경로**: `C:\work\github\minisftp-gui`
- **GitHub**: `https://github.com/kodeholic9/minisftp-gui`
- **사용자 역할**: 부장 / Claude 역할: 김대리 (똘똘한 대리)
- **SFTP 코어**: `minisftp-core = "0.1.1"` (crates.io)

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Framework | Tauri 2.x |
| Frontend | Vue 3 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Pinia |
| Icons | Lucide Vue Next |
| SFTP Core | minisftp-core 0.1.1 (Rust) |
| 취소 토큰 | tokio-util 0.7 CancellationToken |

## 프로젝트 구조

```
minisftp-gui/
├── src/
│   ├── components/
│   │   ├── NavBar.vue          # 세션 선택 + 연결/해제 버튼
│   │   ├── LocalPane.vue       # 로컬 파일 브라우저
│   │   ├── RemotePane.vue      # 리모트 SFTP 브라우저
│   │   ├── BottomPane.vue      # 로그 + 전송 진행률 + 취소
│   │   ├── SessionModal.vue    # 세션 추가/편집 다이얼로그
│   │   └── ConfirmDialog.vue   # 범용 확인 다이얼로그
│   └── stores/
│       ├── sftp.ts             # SFTP 연결/파일 상태
│       ├── local.ts            # 로컬 파일시스템 상태
│       └── sessions.ts         # 세션 영속 저장
└── src-tauri/
    └── src/
        ├── commands/
        │   ├── connect.rs      # cmd_connect → Result<String(홈경로)>
        │   ├── fs.rs           # cmd_ls, cmd_mkdir, cmd_rm
        │   ├── transfer.rs     # cmd_get, cmd_put, cmd_cancel_transfer
        │   └── local.rs        # cmd_local_drives, cmd_local_ls, cmd_local_resolve
        └── lib.rs              # SftpState, CancelState 전역 관리
```

## 전역 상태 (lib.rs)

```rust
pub struct SftpState(pub Mutex<Option<SftpClient>>);
pub struct CancelState(pub Mutex<Option<CancellationToken>>);
```

## 주요 구현 패턴

### 전송 취소 (transfer.rs)
```rust
// 전송 시작 시 새 토큰 발급
let token = CancellationToken::new();
*cancel.0.lock().await = Some(token.clone());

// get/put에 token 전달
sftp.get(&remote, &local, on_progress, token).await

// 취소 커맨드
#[tauri::command]
pub async fn cmd_cancel_transfer(cancel: State<'_, CancelState>) -> Result<(), String> {
    if let Some(token) = cancel.0.lock().await.as_ref() {
        token.cancel();
    }
    Ok(())
}
```

### TransferResult (0.1.1에서 Cancelled 추가됨)
```rust
match r {
    TransferResult::Completed(n)  => format!("Completed({})", n),
    TransferResult::Resumed(n)    => format!("Resumed({})", n),
    TransferResult::Skipped       => "Skipped".to_string(),
    TransferResult::Cancelled(n)  => format!("Cancelled({})", n),
}
```

### 연결 (connect.rs)
- `cmd_connect` → `Result<String, String>` (홈 경로 반환)
- 홈 경로 추정: root → `/root`, 그 외 → `/home/{username}`

### 경로 관리 (sftp.ts)
- `homeDir` ref: 연결 직후 받은 홈 경로 저장
- `normalizePath()`: 상대경로/`..` 처리 → 항상 절대경로 유지
- `ls(".")` 대신 `ls(home)` 으로 초기 목록 로드

### 컨텍스트 메뉴
- **RemotePane**: 다운로드(파란색) + 삭제(빨간색)
- **LocalPane**: 업로드(초록색, 미연결 시 비활성화)
- 다운로드 → `local.currentPath` 기준 저장
- 완료/에러 시 `store.progress = null` → 취소 버튼 자동 숨김

### UI 규칙
- 헤더/경로바 고정 높이: `h-9` (36px) — Local/Remote 높이 맞춤
- 미연결 시 Remote 경로바 버튼 비활성화 (`disabled`, `text-zinc-700`)
- 윈도우 최소 크기: `minWidth: 800, minHeight: 560`

## 현재 Known Limitations / Roadmap

- [ ] `pwd()` 정확도 — `minisftp-core`에 `realpath()` 추가 필요
- [ ] 전송 완전 취소 — 현재는 IO 완료까지 진행 (token으로 개선됨)
- [ ] 비밀번호 평문 저장 — OS 키체인 연동 예정
- [ ] 폴더 삭제 (recursive) 미구현
- [ ] SSH 키 인증 미지원
- [ ] 드래그 앤 드롭 미지원

## 코드 작성 규칙

- 파일 상단 주석: `// author: kodeholic (powered by Claude)`
- 의미 있는 변수명, 복잡한 로직엔 한국어 주석
- 코딩 요청 시에만 코드 작성
- 과도한 엔지니어링 지양 — "지금 필요한가?" 우선

## Git

```bash
cd C:\work\github\minisftp-gui
git add .
git commit -m "feat: ..."
git push
```
- `.gitignore`에 `src-tauri/target/`, `**/sessions.json` 포함
- Windows 자격 증명 관리자에 GitHub 계정 저장됨 (자동 인증)
