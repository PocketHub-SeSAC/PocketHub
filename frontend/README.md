# 포켓 헙 (PoketHub) 프론트엔드 목업

파일 및 일정 관리 기반 협업 플랫폼의 화면 목업입니다. 백엔드 없이 **목업 데이터**로 처음부터 끝까지 눌러 볼 수 있고, 환경 변수 하나로 실제 서버에 붙습니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 생성 (Vercel 배포 시 vercel.json 이 모든 주소를 index.html 로 보냄)
```

- 데모 계정: `saessak@example.com` / `password123` (다른 사용자: snail·acorn·cloud@example.com, 비밀번호 같음)
- 주소 뒤에 `?dev` 를 붙이면 목업 조작판이 보입니다: 사용자 전환, 응답 속도, "다음 요청 실패"(오류 화면 확인), 목업 초기화.

## 목업 ↔ 실제 서버 전환 (`.env`)

| 변수 | 값 | 설명 |
| --- | --- | --- |
| `VITE_USE_MOCK` | `true` / `false` | `true`: 브라우저 안 목업 서버(`src/mock`), `false`: 실제 요청 |
| `VITE_API_BASE_URL` | 예: `https://api.pockethub.com` | 실제 서버 주소. 비우면 같은 도메인으로 요청 |

화면 코드는 `src/api/*.js` 함수만 부르므로, 전환해도 화면은 고치지 않습니다.

## 폴더 구조와 담당

번호는 API 명세서의 "역할 분담" 번호입니다. **각자 자기 번호 파일만 고치면 됩니다.**

| 담당 | API | 백엔드 연결 시 고칠 파일 | 화면 (필요할 때만) | 목업 (목업을 계속 쓸 때만) |
| --- | --- | --- | --- | --- |
| 1 회원·인증 | API-001~004 | `src/api/auth.js` | `src/features/auth/` | `src/mock/handlers/auth.js` |
| 2 팀·팀원 | API-005~012 | `src/api/teams.js` | `src/features/teams/` | `src/mock/handlers/teams.js` |
| 3 파일·커밋 | API-013~021 | `src/api/files.js`, `src/config/upload.js` | `src/features/files/` | `src/mock/handlers/files.js` |
| 4 Task | API-022~028 | `src/api/tasks.js` | `src/features/tasks/` | `src/mock/handlers/tasks.js` |
| 5 PR·리뷰 | API-029~037 | `src/api/pulls.js` | `src/features/pulls/` | `src/mock/handlers/pulls.js` |

공통(한 사람이 맡아 정리 권장)

| 파일 | 하는 일 | 언제 고치나 |
| --- | --- | --- |
| `src/api/adapter.js` | 응답 껍데기 벗기기(`unwrap`), 오류 문구(`toApiError`), 필드 이름 맞추기(`normalize*`) | 공통 응답 형식·필드 이름이 확정됐을 때. 도메인별 `normalize*` 함수는 해당 담당이 고쳐도 됨 |
| `src/api/client.js` | 토큰 헤더, 401(로그인으로)·404("찾을 수 없습니다.") 처리, 목업/실서버 전환 | 인증 방식(쿠키 등)이나 공통 헤더가 바뀔 때 |
| `src/api/token.js` | 토큰 저장 위치 | 저장 방식이 바뀔 때 |
| `src/styles/themes.css` | 색 변수 (기본·다크·핑크 테마) | 색을 바꿀 때 — 컴포넌트 CSS에는 색을 직접 쓰지 않음 |
| `src/styles/base.css` | v5 디자인(도트 테두리·포스트잇) | 공통 모양을 바꿀 때 |

### 경로·메서드가 바뀌면

각 `src/api/<도메인>.js` 맨 위 표(`AUTH_API`, `TEAMS_API` …)만 고칩니다. 경로 문자열은 이 표에만 있습니다. 목업 서버는 경로가 아니라 `key` 로 연결돼 있어서 같이 고칠 필요가 없습니다.

### 요청/응답 모양이 정해지면

1. 요청 본문: 각 `src/api/<도메인>.js` 함수 안에서 맞춥니다 (예: `tasks.js` 의 `toBody`).
2. 응답: `src/api/adapter.js` 의 `unwrap` 과 해당 `normalize*` 를 고칩니다. 화면은 `normalize*` 결과 모양만 씁니다.
3. 상태 코드: 401·404 외의 특별 처리가 필요하면 `client.js` 에 추가합니다.

## 브랜치 규칙 (초안)

| 브랜치 | 용도 | 규칙 |
| --- | --- | --- |
| `main` | 배포용 | 직접 push 금지. PR 로만 합친다. 합쳐지면 Vercel 에 배포 |
| `feature/<도메인명>` | 담당자 작업 | 예: `feature/auth` `feature/teams` `feature/files` `feature/tasks` `feature/pulls` |
| `feature/common-<내용>` | 공통 파일 수정 | `adapter.js` `client.js` `styles/` 등. 영향이 크니 팀에 먼저 알리고 리뷰어 2명 |

작업 순서

1. `git switch main && git pull` 로 최신 main 을 받는다.
2. `git switch -c feature/<도메인명>` (이미 있으면 `git switch feature/<도메인명>` 후 `git merge main`)
3. 자기 담당 파일만 고친다 (위 "폴더 구조와 담당" 표). 다른 도메인 파일을 고쳐야 하면 그 담당자에게 먼저 말한다.
4. `npm run build` 가 통과하는지 확인하고 push → GitHub 에서 `main` 으로 PR 을 연다.
5. 리뷰어 1명 이상 승인 후 합친다. 합친 브랜치는 지운다.

커밋 메시지 예: `[files] 업로드 응답 필드 이름 맞춤`, `[common] 공통 응답 형식 adapter 반영`

## 화면과 주소

| 화면 | 주소 | 모달·패널 (URL 쿼리, 새로고침해도 유지) |
| --- | --- | --- |
| 메인 | `/` | `?modal=create-team` |
| 로그인/회원가입 | `/auth?tab=login`, `/auth?tab=signup` | `&next=` 로그인 후 돌아갈 주소 |
| 팀 목록 | `/teams` | `?modal=create-team` |
| 팀 상세 | `/teams/:teamId` | `?modal=edit-team`, `?modal=delete-team`, `?member=:userId` |
| 파일 | `/teams/:teamId/files` | `?modal=upload`, `?file=:fileId`, `?file=:fileId&modal=delete-file` |
| 커밋 이력 | `/teams/:teamId/commits` | `?commit=:commitId` |
| 태스크 보드 | `/teams/:teamId/tasks` | `?modal=new-task`, `?task=:taskId`, `&modal=delete-task` |
| PR | `/teams/:teamId/pulls?status=waiting\|approved\|closed`, `/teams/:teamId/pulls/:prId` | `?modal=new-pr`, `?modal=reject` |
| 마이페이지 (Could) | `/me` | `#review` 내가 리뷰할 PR |
| 공통 | 모든 화면 | `?panel=me` 내 정보, `?modal=profile-icon` 아이콘 선택(Could), `?dev` 목업 조작판 |

## 아직 정해지지 않은 것 (임시값)

- 업로드 허용 확장자·최대 크기: `src/config/upload.js` 의 `UPLOAD_RULES`
- 공통 응답 형식·상태 코드: 목업은 `{ success, data, message }` 로 응답, `adapter.js` 가 흡수
- PR 상태 값: 서버에 `WAITING / APPROVED / CLOSED` 로 보낸다고 가정 (`adapter.js` 의 `pullStatusToApi`)

## 추가 기능 (팀 확인 필요)

설계서에 없던 기능으로, 모두 **Could** 입니다. 목업에서 먼저 만들었고, 새 백엔드 API 는 1번(프로필 아이콘)만 필요합니다.

| 기능 | 화면 | 쓰는 API | 관련 파일 |
| --- | --- | --- | --- |
| 1. 프로필 아이콘 | 내 정보 패널 "아이콘 바꾸기", 마이페이지 프로필 아이콘 클릭 → 선택 창(`?modal=profile-icon`). 도트 아이콘 12개 또는 기본(닉네임 첫 글자). 상단 바·팀원 목록·커밋/PR/리뷰 작성자·Task 담당자 옆에 표시 | **새 API** `PATCH /api/v1/members/me` `{ "profileIcon": "cat" }` (`updateMyIcon`), 표시는 API-002·010 등 응답의 `profileIcon` | `src/config/profileIcons.js`(키 목록), `src/components/profileIconArt.js`(그림), `src/components/ProfileIconModal.jsx`, `src/components/Who.jsx` |
| 2. 마이페이지 `/me` | 프로필 / 내가 맡은 Task / 내가 리뷰할 PR(`#review`) / 내 팀 / 최근 내 커밋 5개. 항목을 누르면 해당 상세로 이동 | 기존 API 만: 팀 목록(006) → 팀마다 Task 목록(023)·PR 목록(030, 리뷰 대기)·Commit 목록(018)을 불러 프론트에서 모음 | `src/features/me/MePage.jsx` |
| 3. PR 알림 배지 | 팀 메뉴 PR 탭에 "내가 리뷰할 리뷰 대기 PR 수"(0이면 숨김), 내 PR 이 승인·거부되면 PR 탭에 들어갈 때까지 점(●). 상단 바 닉네임 옆에 전체 합계 → 누르면 `/me#review` | 기존 PR 목록 API(030)만. 화면 이동 시 + 30초마다 다시 불러옴. 확인 여부는 localStorage(`pockethub.prSeen.<내 id>`)에 PR 별로 기록 | `src/features/pulls/prNoti.jsx` |

- 프로필 아이콘 그림은 직접 그린 10×10 도트 디자인이고, 색은 테마 변수(`--ink`, `--tint`, `--paper`)를 따릅니다. 서버에는 키 문자열만 저장합니다(사진 업로드 없음).
- 알림 배지 색은 `src/styles/themes.css` 의 `--noti-bg`, `--noti-text`, `--noti-dot` 로 테마마다 정합니다.
- 마이페이지와 배지는 팀 수만큼 요청을 보냅니다. 팀이 많아지면 백엔드에 "내 리뷰 대기 PR", "내 Task" 같은 모아 보기 API 를 두는 편이 좋습니다(팀 논의).

## 담당자 메모

### 1 회원·인증 — 추가 필요 (프로필 아이콘, Could)

- **`PATCH /api/v1/members/me` 추가 필요.** 본문 `{ "profileIcon": "cat" }`, 기본 아이콘으로 되돌릴 때는 `{ "profileIcon": null }`. 응답은 내 정보(API-002 와 같은 모양). 프론트는 `src/api/auth.js` 의 `updateMyIcon` 이 임시 경로로 부르고 있다.
- **API-002(내 정보)·API-010(팀원 목록) 응답에 `profileIcon` 포함 필요.** 커밋·PR·리뷰 작성자, Task 담당자처럼 사람이 들어가는 다른 응답에도 있으면 그 자리에 아이콘이 보인다. 없으면 닉네임 첫 글자 아이콘으로 보인다.
- 아이콘 키 목록: `cat dog rabbit bear penguin chick sprout snail acorn cloud mushroom star` (`src/config/profileIcons.js`). 서버에서도 이 목록으로 검사하면 된다.

### 3 파일·커밋 — 백엔드와 맞출 것

- **파일 삭제(API-017)의 커밋 메시지는 쿼리 파라미터로 보낸다.**
  `DELETE /api/v1/teams/{teamId}/files/{fileId}?message=<커밋 메시지>` (URL 인코딩됨, 본문 없음)
  DELETE 본문은 서버·프록시가 버리는 경우가 많아서 쿼리로 정했다. 백엔드가 다른 이름(예: `commitMessage`)을 쓰면 `src/api/files.js` 의 `deleteFile` 한 줄만 바꾸면 된다.
- **커밋 규칙(확정): 파일 1개 = 커밋 1개.** 업로드(API-013)는 `multipart/form-data` 로 `file`(1개) + `message`(커밋 메시지, 필수)를 보낸다. 필드 이름이 다르면 `src/api/files.js` 의 `uploadFile` 을 고친다. 화면은 1개만 받고, 여러 개를 넣으면 "파일은 한 번에 1개만 올릴 수 있어요."를 보여준다.
- 다운로드(API-016, 021)는 파일 바이너리를 받고, 파일 이름은 `Content-Disposition` 헤더(`filename*=UTF-8''…` 우선)에서 읽는다.
- 업로드 허용 확장자·최대 크기가 정해지면 `src/config/upload.js` 의 `UPLOAD_RULES` 를 바꾼다(화면 검증과 목업 검증이 함께 바뀜).

### 4 Task — 상태 변경

- 상태 변경은 방향 제한이 없다(TODO ↔ DOING ↔ DONE, TODO ↔ DONE 포함). 보드 드래그와 상세 패널의 상태 버튼 모두 `PATCH /api/v1/teams/{teamId}/tasks/{taskId}/status` (API-026) 하나로 보낸다. 본문 `{ "status": "TODO" | "DOING" | "DONE" }`.
- 승인된 PR 이 연결된 DONE Task 를 되돌릴 때만 화면에서 "승인된 PR이 연결된 Task예요. 상태를 바꿀까요?"를 묻는다(Task별 PR 조회 API-028 로 확인). 서버는 막지 않는다고 가정.

## 범위 밖 (만들지 않음)

실제 Git 연동, Clone/Push, 브랜치, 코드 Diff, 실제 Merge/충돌 해결, CI/CD, 팀 탈퇴.

`legacy/` 에는 이전 단일 HTML 목업(v1 원본, 빌드 스크립트, 캡처)이 보관돼 있습니다. 디자인 기준이었던 v5 는 `Documents\pockethub-deploy\index.html` 입니다.
