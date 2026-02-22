# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [0.1.1] - 2025-02-22

### Added
- **전송 취소 기능** — `tokio-util` CancellationToken 기반으로 전송 중 취소 버튼 클릭 시 즉시 중단
- **BottomPane 취소 버튼** — 전송 중일 때만 표시, 완료/에러/취소 시 자동 숨김
- **Remote 홈 버튼** — 경로바 좌측에 홈 아이콘 추가, 클릭 시 계정 홈 디렉토리로 이동
- **LocalPane 업로드 컨텍스트 메뉴** — 우클릭 시 업로드 메뉴 표시 (미연결 시 비활성화)
- **로컬 파일 store 분리** — `local.ts` Pinia store 신규 생성, LocalPane 경로를 RemotePane과 공유
- **다운로드 경로 정확화** — 로컬 현재 디렉토리 기준으로 저장 (기존: 앱 실행 디렉토리)
- **전송 완료 후 목록 자동 새로고침** — 다운로드 후 LocalPane, 업로드 후 RemotePane 갱신
- **SKILL.md** — 새 창에서 이어서 작업할 수 있는 Claude 컨텍스트 파일

### Changed
- **QUEUE/HISTORY 탭 제거** — BottomPane을 LOGS 단일 탭으로 단순화
- **전송 진행률 표시** — BottomPane 우측 상단 인라인으로 이동 (% + 속도 + 진행바)
- **Remote 컨텍스트 메뉴** — 다운로드 + 삭제만 표시 (업로드 제거)
- **미연결 시 Remote UI 비활성화** — 홈/위로 버튼 회색 처리, 경로창 빈 값 표시
- **윈도우 초기 크기 변경** — 800×600 → 1024×680
- **minisftp-core 버전 업** — 0.1 → 0.1.1 (`TransferResult::Cancelled` variant 추가 대응)

### Fixed
- **Local/Remote 높이 불일치** — 헤더/경로바를 `h-9` (36px) 고정으로 통일, 목록 유무와 무관하게 항상 동일한 높이 유지
- **다운로드 파일 위치** — 앱 실행 디렉토리 대신 LocalPane 현재 경로에 저장되도록 수정
- **취소 버튼 잔류** — 전송 완료/에러 시 `progress = null` 처리로 자동 숨김

### Security
- **윈도우 최소 크기 제한** — `minWidth: 800, minHeight: 560` 설정으로 UI 깨짐 방지
- **`.gitignore` 강화** — `**/sessions.json` 추가 (비밀번호 평문 포함 파일 업로드 방지)

---

## [0.1.0] - 2025-02-21

### Added
- 초기 릴리즈
- 세션 관리 (추가/편집/삭제/즉시연결/재연결 확인)
- 로컬/리모트 듀얼 패널 파일 브라우저
- 다운로드/업로드/삭제 (우클릭 컨텍스트 메뉴)
- 전송 진행률 실시간 표시
- 커스텀 확인 다이얼로그 (`ConfirmDialog.vue`)
- 연결 상태/에러 표시 (NavBar 우측)
- 로그 패널 (연결 상태, 전송 결과)
- 로그 Clear 버튼 / 텍스트 선택 복사 지원
- 좌우/상하 리사이즈 핸들
- Remote 새 폴더 생성
