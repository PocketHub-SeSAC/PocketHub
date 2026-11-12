# 포켓 헙 (PoketHub) 프론트엔드

파일 및 일정 관리 기반 협업 플랫폼의 프론트엔드입니다. Next.js(App Router)로 만들었고, 백엔드 없이 **목업 데이터**로 처음부터 끝까지 눌러 볼 수 있습니다. 환경변수 하나로 실제 서버에 붙습니다.

브랜치·커밋·코드 규칙은 팀 컨벤션 [docs/convention.md](../docs/convention.md)를 따릅니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버 http://localhost:3000
npm run build      # 배포용 빌드 (.next/)
npm run start      # 빌드한 결과 실행
npm test           # Playwright E2E 테스트 (처음 한 번: npx playwright install chromium)
```

### 목업 계정

| 이메일 | 비밀번호 | 닉네임 |
| --- | --- | --- |
| `saessak@example.com` | `password123` | 새싹 (데모 계정, 로그인 칸에 미리 채워짐) |
| `snail@example.com` | `password123` | 달팽이 |
| `acorn@example.com` | `password123` | 도토리 |
| `cloud@example.com` | `password123` | 구름 |

주소 뒤에 `?dev`를 붙이면 목업 조작판이 보입니다. 사용자 전환, 응답 속도, "다음 요청 실패"(오류 화면 확인), 목업 초기화를 할 수 있습니다.

### 목업 ↔ 실제 서버 전환 (`.env.local`)

`.env.example`을 복사해 `.env.local`을 만들고 값을 바꿉니다. 바꾼 뒤에는 개발 서버를 다시 켜야 합니다.

| 변수 | 값 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK` | `true` / `false` | `true`: 브라우저 안 목업 서버(`mocks/`), `false`: 실제 요청 |
| `NEXT_PUBLIC_API_URL` | 예: `https://api.pockethub.com` | 실제 서버 주소. 비우면 같은 도메인으로 요청 |

화면 코드는 `services/*.js` 함수만 부르므로, 전환해도 화면은 고치지 않습니다.

## 폴더 지도

```
frontend/
 ├── app/                 주소별 화면 (page.js), 공통 틀 (layout.js), 로딩·오류 화면
 │   ├── layout.js        <html>·글꼴·테마 깜빡임 방지 + 공통 틀(AppShell)
 │   ├── page.js          /            메인
 │   ├── auth/            /auth        로그인·회원가입
 │   ├── me/              /me          마이페이지 (로그인 필요)
 │   └── teams/           /teams       팀 목록 (layout.js 가 로그인 확인)
 │       └── [teamId]/    팀 상세 + files/ commits/ tasks/ pulls/ (layout.js 가 팀 메뉴·접근 제어)
 ├── components/          화면 조각. 폴더 = 기능
 │   ├── common/          상단 바, 모달, 알림, 입력칸, 아이콘, 로그인 확인(RequireAuth) 등 공용
 │   ├── auth/  main/  team/  file/  commit/  task/  pull-request/  review/  me/
 ├── hooks/               useAsync(불러오기 상태), useQuery(URL 쿼리로 모달 열기), useHash
 ├── services/            API 호출. 화면은 여기 함수만 부른다 (fetch 는 client.js 에만)
 ├── mocks/               브라우저 안 목업 서버 (db, handlers)
 ├── utils/               형식·검증, 테마, 업로드 규칙, 프로필 아이콘 목록
 ├── styles/              themes.css(색 변수 3개 테마), base.css(도트 디자인)
 ├── e2e/                 Playwright 테스트와 기준 스크린샷
 └── public/              정적 파일
```

## 화면이 그려지는 흐름

```
app/teams/[teamId]/tasks/page.js          주소에 맞는 화면을 고른다 (서버 컴포넌트, 얇게)
  → components/task/TasksScreen.jsx       화면을 그린다 ('use client')
    → hooks/useAsync.js, useQuery.js      불러오기 상태, ?task= 같은 URL 쿼리
      → services/tasks.js                 getTasks(teamId) — 경로·메서드는 TASKS_API 표에
        → services/client.js              목업이면 mocks/server.js 로, 아니면 fetch(NEXT_PUBLIC_API_URL + 경로)
          → services/adapter.js           응답 껍데기 벗기기·필드 이름 맞추기 → 화면으로
```

- 로그인 토큰·테마·목업 서버가 브라우저에서 돌아가므로 화면 컴포넌트는 대부분 `'use client'`입니다. `app/` 아래 `page.js`·`layout.js`는 서버 컴포넌트로 두고 화면 컴포넌트를 불러오기만 합니다.
- 모달·패널은 URL 쿼리(`?modal=`, `?file=`, `?task=` …)로 엽니다. 새로고침하거나 뒤로 가기를 해도 같은 상태가 됩니다. `useSearchParams`를 쓰는 화면은 `Suspense`로 감쌌습니다.
- 401은 로그인 화면으로, 404는 "찾을 수 없습니다." 후 메인으로 보냅니다(`components/common/AppShell.jsx`).

## 담당자별로 볼 폴더

번호는 API 명세서의 "역할 분담" 번호입니다. **각자 자기 번호 파일만 고치면 됩니다.**

| 담당 | API | 백엔드 연결 시 고칠 파일 | 화면 | 주소 (`app/`) | 목업 (목업을 계속 쓸 때만) |
| --- | --- | --- | --- | --- | --- |
| 1 회원·인증 | API-001~004 | `services/auth.js` | `components/auth/` | `auth/` | `mocks/handlers/auth.js` |
| 2 팀·팀원 | API-005~012 | `services/teams.js` | `components/team/` | `teams/page.js`, `teams/[teamId]/page.js`, `layout.js` | `mocks/handlers/teams.js` |
| 3 파일·커밋 | API-013~021 | `services/files.js`, `utils/upload.js` | `components/file/`, `components/commit/` | `teams/[teamId]/files/`, `commits/` | `mocks/handlers/files.js` |
| 4 Task | API-022~028 | `services/tasks.js` | `components/task/` | `teams/[teamId]/tasks/` | `mocks/handlers/tasks.js` |
| 5 PR·리뷰 | API-029~037 | `services/pulls.js` | `components/pull-request/`, `components/review/` | `teams/[teamId]/pulls/` | `mocks/handlers/pulls.js` |

공통(한 사람이 맡아 정리 권장)

| 파일 | 하는 일 | 언제 고치나 |
| --- | --- | --- |
| `services/adapter.js` | 응답 껍데기 벗기기(`unwrap`), 오류 문구(`toApiError`), 필드 이름 맞추기(`normalize*`) | 공통 응답 형식·필드 이름이 확정됐을 때. 도메인별 `normalize*` 함수는 해당 담당이 고쳐도 됨 |
| `services/client.js` | 토큰 헤더, 401·404 처리 연결, 목업/실서버 전환 | 인증 방식(쿠키 등)이나 공통 헤더가 바뀔 때 |
| `services/token.js` | 토큰 저장 위치 | 저장 방식이 바뀔 때 |
| `components/common/AppShell.jsx` | 모든 화면 공통 틀, 401·404 때 화면 이동 | 공통 틀이나 오류 처리 흐름이 바뀔 때 |
| `styles/themes.css` | 색 변수 (기본·다크·핑크 테마) | 색을 바꿀 때 — 컴포넌트 CSS에는 색을 직접 쓰지 않음 |
| `styles/base.css` | v5 디자인(도트 테두리·포스트잇) | 공통 모양을 바꿀 때 |

### 경로·메서드가 바뀌면

각 `services/<도메인>.js` 맨 위 표(`AUTH_API`, `TEAMS_API` …)만 고칩니다. 경로 문자열은 이 표에만 있습니다. 목업 서버는 경로가 아니라 `key`로 연결돼 있어서 같이 고칠 필요가 없습니다.

### 요청/응답 모양이 정해지면

1. 요청 본문: 각 `services/<도메인>.js` 함수 안에서 맞춥니다 (예: `tasks.js`의 `toBody`).
2. 응답: `services/adapter.js`의 `unwrap`과 해당 `normalize*`를 고칩니다. 화면은 `normalize*` 결과 모양만 씁니다.
3. 상태 코드: 401·404 외의 특별 처리가 필요하면 `services/client.js`에 추가합니다.

## 화면과 주소

| 화면 | 주소 | 모달·패널 (URL 쿼리, 새로고침해도 유지) |
| --- | --- | --- |
| 메인 | `/` | (예전 `?modal=create-team`은 `/teams?modal=create-team`으로 보냄) |
| 로그인/회원가입 | `/auth?tab=login`, `/auth?tab=signup` | `&next=` 로그인 후 돌아갈 주소 |
| 팀 목록 | `/teams` | `?modal=create-team` |
| 팀 상세 | `/teams/[teamId]` | `?modal=edit-team`, `?modal=delete-team`, `?member=:userId` |
| 파일 | `/teams/[teamId]/files` | `?modal=upload`, `?file=:fileId`, `?file=:fileId&modal=delete-file` |
| 커밋 이력 | `/teams/[teamId]/commits` | `?commit=:commitId` |
| 태스크 보드 | `/teams/[teamId]/tasks` | `?modal=new-task`, `?task=:taskId`, `&modal=delete-task` |
| PR | `/teams/[teamId]/pulls?status=waiting\|approved\|closed`, `/teams/[teamId]/pulls/[prId]` | `?modal=new-pr`, `?modal=reject` |
| 마이페이지 (Could) | `/me` | `#review` 내가 리뷰할 PR |
| 공통 | 모든 화면 | `?panel=me` 내 정보, `?modal=profile-icon` 아이콘 선택(Could), `?dev` 목업 조작판 |

## 테스트 (Playwright)

`npm test`는 production 빌드(목업 모드, 3000번)와 개발 서버(실서버 모드, 3001번)를 띄워 `e2e/`의 테스트를 돌립니다.

| 파일 | 확인하는 것 |
| --- | --- |
| `screens.spec.js` | 주소·모달·패널별 화면 34장을 `e2e/screenshots/` 기준 스크린샷과 비교 |
| `flows-*.spec.js` | 로그인·팀·파일·Task·PR 흐름, 추가 기능(프로필 아이콘·PR 알림 배지·마이페이지·테마) |
| `api.spec.js` | 목업 모드의 401·404 공통 처리, 요청 실패 시 다시 시도 |
| `api-real.spec.js` | 실서버 모드에서 `NEXT_PUBLIC_API_URL`로 요청하는지, 토큰 헤더와 응답 처리 (API 요청은 테스트가 가로챔) |

- 기준 스크린샷은 Next.js로 옮기기 전 Vite 버전에서 Windows로 찍었습니다. 운영체제마다 글꼴이 조금 달라 다른 OS에서는 화면 테스트가 실패할 수 있습니다.
- 화면을 일부러 바꿨다면 `npx playwright test --update-snapshots`로 기준을 새로 찍고, 바뀐 그림을 PR에서 같이 확인합니다.
- 글꼴(Pretendard·Galmuri·Press Start 2P)을 CDN에서 받으므로 인터넷이 필요합니다.

## 아직 정해지지 않은 것 (임시값)

- 업로드 허용 확장자·최대 크기: `utils/upload.js`의 `UPLOAD_RULES`
- 공통 응답 형식·상태 코드: 목업은 `{ success, data, message }`로 응답, `services/adapter.js`가 흡수
- PR 상태 값: 서버에 `WAITING / APPROVED / CLOSED`로 보낸다고 가정 (`services/adapter.js`의 `pullStatusToApi`)

## 추가 기능 (팀 확인 필요)

설계서에 없던 기능으로, 모두 **Could** 입니다. 목업에서 먼저 만들었고, 새 백엔드 API는 1번(프로필 아이콘)만 필요합니다.

| 기능 | 화면 | 쓰는 API | 관련 파일 |
| --- | --- | --- | --- |
| 1. 프로필 아이콘 | 내 정보 패널 "아이콘 바꾸기", 마이페이지 프로필 아이콘 클릭 → 선택 창(`?modal=profile-icon`). 도트 아이콘 12개 또는 기본(닉네임 첫 글자). 상단 바·팀원 목록·커밋/PR/리뷰 작성자·Task 담당자 옆에 표시 | **새 API** `PATCH /api/v1/members/me` `{ "profileIcon": "cat" }` (`updateMyIcon`), 표시는 API-002·010 등 응답의 `profileIcon` | `utils/profileIcons.js`(키 목록), `components/common/profileIconArt.js`(그림), `components/me/ProfileIconModal.jsx`, `components/common/Who.jsx` |
| 2. 마이페이지 `/me` | 프로필 / 내가 맡은 Task / 내가 리뷰할 PR(`#review`) / 내 팀 / 최근 내 커밋 5개. 항목을 누르면 해당 상세로 이동 | 기존 API만: 팀 목록(006) → 팀마다 Task 목록(023)·PR 목록(030, 리뷰 대기)·Commit 목록(018)을 불러 프론트에서 모음 | `components/me/MeScreen.jsx` |
| 3. PR 알림 배지 | 팀 메뉴 PR 탭에 "내가 리뷰할 리뷰 대기 PR 수"(0이면 숨김), 내 PR이 승인·거부되면 PR 탭에 들어갈 때까지 점(●). 상단 바 닉네임 옆에 전체 합계 → 누르면 `/me#review` | 기존 PR 목록 API(030)만. 화면 이동 시 + 30초마다 다시 불러옴. 확인 여부는 localStorage(`pockethub.prSeen.<내 id>`)에 PR 별로 기록 | `components/pull-request/PrNotiProvider.jsx` |

- 프로필 아이콘 그림은 직접 그린 10×10 도트 디자인이고, 색은 테마 변수(`--ink`, `--tint`, `--paper`)를 따릅니다. 서버에는 키 문자열만 저장합니다(사진 업로드 없음).
- 알림 배지 색은 `styles/themes.css`의 `--noti-bg`, `--noti-text`, `--noti-dot`으로 테마마다 정합니다.
- 마이페이지와 배지는 팀 수만큼 요청을 보냅니다. 팀이 많아지면 백엔드에 "내 리뷰 대기 PR", "내 Task" 같은 모아 보기 API를 두는 편이 좋습니다(팀 논의).

## 담당자 메모

### 1 회원·인증 — 추가 필요 (프로필 아이콘, Could)

- **`PATCH /api/v1/members/me` 추가 필요.** 본문 `{ "profileIcon": "cat" }`, 기본 아이콘으로 되돌릴 때는 `{ "profileIcon": null }`. 응답은 내 정보(API-002와 같은 모양). 프론트는 `services/auth.js`의 `updateMyIcon`이 임시 경로로 부르고 있다.
- **API-002(내 정보)·API-010(팀원 목록) 응답에 `profileIcon` 포함 필요.** 커밋·PR·리뷰 작성자, Task 담당자처럼 사람이 들어가는 다른 응답에도 있으면 그 자리에 아이콘이 보인다. 없으면 닉네임 첫 글자 아이콘으로 보인다.
- 아이콘 키 목록: `cat dog rabbit bear penguin chick sprout snail acorn cloud mushroom star` (`utils/profileIcons.js`). 서버에서도 이 목록으로 검사하면 된다.

### 3 파일·커밋 — 백엔드와 맞출 것

- **파일 삭제(API-017)의 커밋 메시지는 쿼리 파라미터로 보낸다.**
  `DELETE /api/v1/teams/{teamId}/files/{fileId}?message=<커밋 메시지>` (URL 인코딩됨, 본문 없음)
  DELETE 본문은 서버·프록시가 버리는 경우가 많아서 쿼리로 정했다. 백엔드가 다른 이름(예: `commitMessage`)을 쓰면 `services/files.js`의 `deleteFile` 한 줄만 바꾸면 된다.
- **커밋 규칙(확정): 파일 1개 = 커밋 1개.** 업로드(API-013)는 `multipart/form-data`로 `file`(1개) + `message`(커밋 메시지, 필수)를 보낸다. 필드 이름이 다르면 `services/files.js`의 `uploadFile`을 고친다. 화면은 1개만 받고, 여러 개를 넣으면 "파일은 한 번에 1개만 올릴 수 있어요."를 보여준다.
- 다운로드(API-016, 021)는 파일 바이너리를 받고, 파일 이름은 `Content-Disposition` 헤더(`filename*=UTF-8''…` 우선)에서 읽는다.
- 업로드 허용 확장자·최대 크기가 정해지면 `utils/upload.js`의 `UPLOAD_RULES`를 바꾼다(화면 검증과 목업 검증이 함께 바뀜).

### 4 Task — 상태 변경

- 상태 변경은 방향 제한이 없다(TODO ↔ DOING ↔ DONE, TODO ↔ DONE 포함). 보드 드래그와 상세 패널의 상태 버튼 모두 `PATCH /api/v1/teams/{teamId}/tasks/{taskId}/status` (API-026) 하나로 보낸다. 본문 `{ "status": "TODO" | "DOING" | "DONE" }`.
- 승인된 PR이 연결된 DONE Task를 되돌릴 때만 화면에서 "승인된 PR이 연결된 Task예요. 상태를 바꿀까요?"를 묻는다(Task별 PR 조회 API-028로 확인). 서버는 막지 않는다고 가정.

## 범위 밖 (만들지 않음)

실제 Git 연동, Clone/Push, 브랜치, 코드 Diff, 실제 Merge/충돌 해결, CI/CD, 팀 탈퇴.
