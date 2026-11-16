```
1. 브랜치 규칙
2. 커밋 메시지 규칙
3. Pull Request 규칙
4. 파일/폴더명 규칙
5. Java 코드 컨벤션
6. JavaScript/Next.js 코드 컨벤션
7. 보안 파일 관리 규칙
```

## 1. 브랜치 규칙 (Branch Convention)

### 1-1. 브랜치 구성

프로젝트의 안정적인 코드 관리와 기능별 독립적인 개발을 위해 Git Flow를 간소화한 브랜치 전략을 사용한다.

| 브랜치 | 용도 | 설명 |
| --- | --- | --- |
| main | 최종 배포 | 정상적으로 동작하는 안정된 코드만 관리 |
| dev | 통합 개발 | 각 기능 브랜치의 개발 내용을 통합하는 브랜치 |
| feature | 기능 개발 | 신규 기능 개발을 위한 브랜치 |
| fix | 버그 수정 | 개발 중 발견한 오류 및 버그 수정 |
| hotfix | 긴급 수정 | main 브랜치에서 발생한 긴급 오류 수정 |

### 1-2. 브랜치 생성 규칙

브랜치 이름은 다음 형식을 사용한다.

`타입/기능명`

| 타입 | 사용 목적 | 예시 |
| --- | --- | --- |
| feature | 신규 기능 개발 | feature/user-login |
| fix | 버그 수정 | fix/file-upload-error |
| hotfix | 긴급 오류 수정 | hotfix/login-error |

브랜치 이름은 영문 소문자와 하이픈(-)을 사용한다.

### 1-3. 브랜치 작업 흐름

1. 모든 기능 개발은 dev 브랜치에서 새로운 브랜치를 생성하여 시작한다.
2. 각 팀원은 자신이 담당한 기능 브랜치에서 작업한다.
3. 개발이 완료되면 원격 저장소에 브랜치를 Push한다.
4. GitHub에서 dev 브랜치를 대상으로 Pull Request를 생성한다.
5. 팀원 한 명 이상의 코드 리뷰 및 승인을 받는다.
6. 리뷰가 완료되면 dev 브랜치에 병합한다.
7. 최종 테스트가 완료되면 dev 브랜치의 내용을 main에 반영한다.

**브랜치 작업 예시**

```
# dev 브랜치로 이동
git checkout dev

# 최신 코드 가져오기
git pull origin dev

# 기능 브랜치 생성
git checkout -b feature/task-management

# 작업 완료 후 변경 사항 추가
git add .

# 커밋
git commit -m "feat: add task management"

# 원격 저장소에 Push
git push origin feature/task-management
```

### 1-4. 브랜치 관리 규칙

- main과 dev 브랜치에 직접 Push하지 않는다.
- 모든 기능 개발은 독립적인 브랜치에서 진행한다.
- 하나의 브랜치에서는 하나의 기능 또는 수정 작업을 담당한다.
- 다른 팀원의 브랜치를 임의로 수정하거나 삭제하지 않는다.
- 작업이 끝난 브랜치는 병합 후 삭제한다.
- 기존 작업 내용을 덮어쓰는 강제 Push(`-force`)는 원칙적으로 금지한다.

---

## 2. 커밋 메시지 규칙 (Commit Convention)

### 2-1. 커밋 메시지 작성 형식

커밋 메시지는 변경된 작업의 목적과 내용을 쉽게 파악할 수 있도록 작성한다.

**작성 형식**

`타입: 작업 내용`

예시:

```
feat: 로그인 구현
fix: 파일 업로드 에러 해결
docs: README 수정
```

### 2-2. 커밋 타입

| 타입 | 설명 | 예시 |
| --- | --- | --- |
| feat | 새로운 기능 추가 | feat: 팀 생성 기능 추가 |
| fix | 버그 및 오류 수정 | fix: 로그인 에러 해결 |
| docs | 문서 작성 및 수정 | docs: API 문서 수정 |
| style | 코드 포맷 및 스타일 수정 | style: 코드 포맷 수정 |
| refactor | 기능 변경 없는 코드 구조 개선 | refactor: task 서비스 개선 |
| test | 테스트 코드 작성 및 수정 | test: 테스크 테스크 코드 작성 |
| chore | 설정 파일 및 기타 작업 | chore: dependencies 수정 |
| perf | 성능 개선 | perf: 파일 다운로드 개선 |

### 2-3. 커밋 메시지 작성 원칙

- 타입은 영어로, 커밋 메시지는 한글로 작성한다.
- 타입 뒤에 콜론(:)과 공백을 작성한다.
- 작업 내용은 동사 원형을 사용하여 작성한다.
- 커밋 하나에는 하나의 논리적인 작업만 포함한다.
- 의미 없는 메시지(`update`, `수정`, `test`)는 사용하지 않는다.
- 코드 변경 사항이 없는 단순 파일 저장은 커밋하지 않는다.

**잘못된 예시**

```
update
수정
test
feat: login
```

**올바른 예시**

```
feat: 회원가입 기능 추가
fix: 이메일 중복 오류 해결
refactor: Task 서비스 로직 분리
docs: 프로젝트 설정 가이드 추가
```

### 2-4. 커밋 단위

다음과 같이 기능별로 커밋을 분리한다.

```
feat: Task 엔티티 추가
feat: Task 리포지토리 추가
feat: Task 서비스 추가
feat: Task 컨트롤러 추가
test: Task 서비스 테스트 추가
```

하나의 작업을 너무 큰 단위로 묶지 않고, 변경 이력을 쉽게 추적할 수 있는 단위로 커밋한다.

---

## 3. Pull Request 규칙 (PR Convention)

### 3-1. PR 생성 목적

Pull Request는 기능 개발이 완료된 코드를 통합 브랜치에 반영하기 전에 팀원들이 변경 사항을 검토하기 위해 사용한다.

모든 기능 개발은 PR을 통해 dev 브랜치에 반영하는 것을 원칙으로 한다.

### 3-2. PR 제목 작성 형식

`[타입] 작업 내용`

| 타입 | 예시 |
| --- | --- |
| Feat | [Feat] Task 등록 기능 구현 |
| Fix | [Fix] 파일 업로드 오류 수정 |
| Refactor | [Refactor] Task Service 구조 개선 |
| Docs | [Docs] API 명세서 업데이트 |

### 3-3. PR 본문 작성 양식

모든 PR은 다음 양식을 사용한다.

```
## 작업 내용
- 구현한 기능 및 수정 내용 작성

## 주요 변경 사항
- 변경된 파일 또는 로직 설명

## 테스트 결과
- [ ] 정상 동작 확인
- [ ] 예외 상황 확인
- [ ] 기존 기능 영향 여부 확인

## 관련 이슈
- #Issue번호

## 참고 사항
- 리뷰 시 확인이 필요한 내용
```

### 3-4. PR 작성 규칙

- PR의 대상 브랜치는 원칙적으로 dev로 지정한다.
- 하나의 PR에는 하나의 기능 또는 목적이 명확한 작업만 포함한다.
- PR 설명에 변경 사항과 테스트 결과를 작성한다.
- 관련 Issue가 있다면 Issue 번호를 연결한다.
- 불필요한 파일이나 개인 설정 파일을 포함하지 않는다.
- 다른 팀원이 변경 사항을 이해할 수 있도록 설명을 작성한다.

### 3-5. 코드 리뷰 규칙

- PR 작성자는 본인의 PR을 승인할 수 없다.
- 리뷰어는 코드의 오류, 중복 코드, 네이밍, 유지보수성 등을 확인한다.
- 수정 사항이 있다면 구체적인 이유와 개선 방향을 전달한다.
- 리뷰 요청 사항을 반영한 후 다시 검토를 요청한다.
- 승인되지 않은 PR은 dev 브랜치에 반영하지 않는다.

### 3-6. PR 승인 기준

다음 조건을 충족하면 PR을 승인할 수 있다.

- 기능이 요구사항에 맞게 구현되었는가?
- 기존 기능에 영향을 주지 않는가?
- 코드 컨벤션을 준수했는가?
- 불필요한 코드나 파일이 포함되지 않았는가?
- 테스트 결과가 정상인가?
- 보안상 문제가 될 수 있는 정보가 포함되지 않았는가?

---

## 4. 파일 / 폴더명 규칙 (Naming Convention)

### 4-1. 공통 규칙

- 파일 및 폴더명은 영문으로 작성한다.
- 공백 대신 하이픈(-) 또는 언더스코어(_)를 사용한다.
- 파일명은 해당 파일의 역할을 명확하게 표현한다.
- 의미를 알 수 없는 축약어는 사용하지 않는다.
- 동일한 역할의 파일은 일관된 네이밍 규칙을 적용한다.

### 4-2. Backend (Java)

Java 파일 및 클래스명은 PascalCase를 사용한다.

| 구분 | 규칙 | 예시 |
| --- | --- | --- |
| 클래스 | PascalCase | TaskService.java |
| 인터페이스 | PascalCase | TaskRepository.java |
| 메서드 | camelCase | findTaskById() |
| 변수 | camelCase | taskName |
| 상수 | UPPER_SNAKE_CASE | MAX_FILE_SIZE |
| 패키지 | 소문자 | com.pokethub.task |

**패키지 구조 예시**

```
backend/
 └── src/
     ├── main/
     │   ├── java/com/pokethub/
     │   │   ├── config/
     │   │   ├── common/
     │   │   ├── user/
     │   │   ├── team/
     │   │   ├── project/
     │   │   ├── task/
     │   │   ├── file/
     │   │   ├── commit/
     │   │   ├── pullrequest/
     │   │   └── review/
     │   └── resources/
     └── test/
```

### 4-3. Frontend (JavaScript / Next.js)

| 구분 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 파일 | PascalCase | TaskCard.jsx |
| 페이지 파일 | Next.js 규칙 | page.js |
| 폴더명 | kebab-case | task-management |
| 변수 | camelCase | taskList |
| 함수 | camelCase | handleTaskCreate() |
| 상수 | UPPER_SNAKE_CASE | MAX_FILE_SIZE |
| 컴포넌트 | PascalCase | TaskList |
| 커스텀 Hook | camelCase, use 접두사 | useTask.js |

**폴더 구조 예시**

```
frontend/
 ├── app/
 │   ├── login/
 │   │   └── page.js
 │   ├── teams/
 │   │   └── page.js
 │   └── projects/
 │       └── [projectId]/
 │           ├── page.js
 │           ├── tasks/
 │           ├── commits/
 │           └── pull-requests/
 ├── components/
 │   ├── common/
 │   ├── task/
 │   ├── file/
 │   ├── commit/
 │   └── review/
 ├── hooks/
 ├── services/
 ├── utils/
 └── public/
```

### 4-4. 기타 파일명 규칙

| 파일 종류 | 작성 규칙 | 예시 |
| --- | --- | --- |
| JSON | 소문자 | package.json |
| 환경 설정 | 소문자 | application.yml |
| Markdown | 소문자 또는 kebab-case | api-specification.md |
| 이미지 | kebab-case | logo-image.png |
| 스타일 | 컴포넌트명 기반 | TaskCard.css |

---

## 5. Java 코드 컨벤션

### 5-1. 기본 작성 규칙

- Java 코드는 Java 표준 네이밍 규칙을 따른다.
- 들여쓰기는 공백 4칸을 사용한다.
- 클래스명은 PascalCase를 사용한다.
- 메서드 및 변수명은 camelCase를 사용한다.
- 상수는 UPPER_SNAKE_CASE를 사용한다.
- 클래스와 메서드의 역할은 명확하게 분리한다.
- 하나의 클래스가 지나치게 많은 책임을 갖지 않도록 한다.

### 5-2. 클래스 작성 규칙

클래스는 각 계층의 책임에 따라 분리한다.

| 클래스 종류 | 역할 | 예시 |
| --- | --- | --- |
| Controller | HTTP 요청 및 응답 처리 | TaskController |
| Service | 비즈니스 로직 처리 | TaskService |
| Repository | 데이터 접근 및 조회 | TaskRepository |
| Entity | 데이터베이스 테이블 매핑 | Task |
| DTO | 요청 및 응답 데이터 전달 | TaskRequest |
| Config | 공통 설정 관리 | SecurityConfig |

### 5-3. 메서드 작성 규칙

- 메서드명은 수행하는 동작을 명확하게 표현한다.
- 조회, 등록, 수정, 삭제 목적에 따라 이름을 구분한다.
- 하나의 메서드에는 하나의 주요 책임을 부여한다.
- 메서드가 지나치게 길어지면 기능을 분리한다.

**예시**

```
public TaskResponse createTask(TaskRequest request) {
    // Task 생성 로직
}

public TaskResponse findTaskById(Long taskId) {
    // Task 조회 로직
}

public void deleteTask(Long taskId) {
    // Task 삭제 로직
}
```

### 5-4. 변수 및 상수 작성 규칙

```
// 변수
String taskName = "로그인 API 구현";
Long taskId = 1L;

// 상수
private static final int MAX_FILE_SIZE = 10;
private static final String DEFAULT_STATUS = "TODO";
```

- 변수명은 의미를 알 수 있도록 작성한다.
- 의미 없는 한 글자 변수명은 반복문 등 제한적인 상황에서만 사용한다.
- 변경되지 않는 값은 상수로 선언한다.
- 매직 넘버와 매직 스트링의 사용을 지양한다.

### 5-5. 예외 처리 규칙

- 예외 발생 가능성이 있는 로직은 명시적으로 처리한다.
- 의미 없는 빈 catch 블록을 사용하지 않는다.
- 사용자에게 내부 시스템 정보나 Stack Trace를 직접 노출하지 않는다.
- 예외 메시지는 발생 원인을 이해할 수 있도록 작성한다.
- 공통 예외 처리 방식을 사용한다.

**예시**

```
if (task == null) {
    throw new IllegalArgumentException("존재하지 않는 Task입니다.");
}
```

### 5-6. 주석 작성 규칙

- 코드만으로 이해하기 어려운 부분에 주석을 작성한다.
- 코드의 동작을 그대로 반복 설명하는 주석은 지양한다.
- 복잡한 비즈니스 규칙이나 예외 처리의 이유를 설명한다.
- 임시 주석이나 불필요한 주석은 정리한다.

### 5-7. Controller 작성 규칙

- Controller에서는 요청과 응답 처리에 집중한다.
- 비즈니스 로직은 Service 계층에서 처리한다.
- 요청 DTO와 응답 DTO를 구분한다.
- API 응답 형식을 일관되게 유지한다.
- Entity를 API 응답에 직접 노출하지 않는다.

---

## 6. JavaScript / Next.js 코드 컨벤션

### 6-1. 기본 작성 규칙

- JavaScript는 camelCase를 기본으로 사용한다.
- 컴포넌트명은 PascalCase를 사용한다.
- 컴포넌트 파일명은 PascalCase를 사용한다.
- 들여쓰기는 공백 2칸을 사용한다.
- 문자열은 작은따옴표(')를 기본으로 사용한다.
- 문장 끝에는 세미콜론(;)을 사용한다.
- 가능하면 const를 기본으로 사용하고 값 재할당이 필요한 경우 let을 사용한다.
- var 사용은 지양한다.

### 6-2. 변수 및 함수 작성 규칙

```
// 변수
const taskName = '로그인 API 구현';
let taskStatus = 'TODO';

// 함수
function createTask() {
  // Task 생성 로직
}

// 화살표 함수
const getTaskList = () => {
  // Task 목록 조회
};
```

- 변수는 의미가 명확한 이름을 사용한다.
- 함수명은 동작을 표현하는 동사로 시작한다.
- 이벤트 처리 함수는 handle 접두사를 사용한다.

```
const handleSubmit = () => {};
const handleDelete = () => {};
const handleTaskUpdate = () => {};
```

### 6-3. React 컴포넌트 작성 규칙

- 컴포넌트명은 PascalCase를 사용한다.
- 하나의 컴포넌트는 하나의 명확한 역할을 담당한다.
- 반복적으로 사용하는 UI는 공통 컴포넌트로 분리한다.
- Props는 명확한 이름을 사용한다.
- 불필요한 컴포넌트 중첩을 지양한다.

**예시**

```
function TaskCard({ task }) {
  return (
    <div className='task-card'>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  );
}

export default TaskCard;
```

### 6-4. React Hook 작성 규칙

- React Hook은 컴포넌트 최상위에서 호출한다.
- 조건문이나 반복문 내부에서 Hook을 호출하지 않는다.
- 커스텀 Hook은 use 접두사를 사용한다.
- useState는 컴포넌트에서 관리할 상태에 사용한다.
- useEffect는 외부 시스템과의 동기화가 필요한 경우에 사용한다.
- useEffect를 단순한 값 계산 용도로 남용하지 않는다.

**예시**

```
const [taskList, setTaskList] = useState([]);

useEffect(() => {
  // 초기 데이터 조회
}, []);
```

### 6-5. Next.js 작성 규칙

- Next.js App Router 구조를 기본으로 사용한다.
- 페이지는 app 폴더 내부에서 관리한다.
- page.js는 해당 경로의 페이지를 담당한다.
- layout.js는 공통 레이아웃을 담당한다.
- loading.js는 로딩 화면을 담당한다.
- error.js는 해당 경로의 오류 화면을 담당한다.
- 서버 컴포넌트를 기본으로 사용한다.
- useState, useEffect, 브라우저 이벤트 등 클라이언트 기능이 필요한 경우에만 'use client'를 선언한다.

### 6-6. API 호출 및 데이터 관리

- API 호출 코드는 컴포넌트에서 분리하여 관리한다.
- API 요청과 응답 처리는 일관된 형식으로 작성한다.
- API 주소는 환경변수로 관리한다.
- 로딩 및 오류 상태를 고려하여 구현한다.
- 컴포넌트 내부에 중복된 API 호출 로직을 작성하지 않는다.

**예시**

```
export async function getTaskList() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/tasks`
  );

  if (!response.ok) {
    throw new Error('Task 목록을 불러오지 못했습니다.');
  }

  return response.json();
}
```

### 6-7. 조건문 및 반복문 작성 규칙

- 중첩 조건문은 가능한 한 줄인다.
- 조건이 복잡한 경우 별도의 함수로 분리한다.
- 단순한 배열 변환은 map, filter 등의 메서드를 활용한다.
- 반복문 내부에서 불필요한 연산이 반복되지 않도록 한다.

---

## 7. 보안 파일 관리 규칙 (Security Convention)

### 7-1. 환경변수 관리

- DB 계정 및 비밀번호는 소스코드에 직접 작성하지 않는다.
- JWT Secret Key는 환경변수로 관리한다.
- 외부 API Key 및 인증 정보는 환경변수로 관리한다.
- 실제 환경변수 파일은 GitHub에 업로드하지 않는다.
- .env.example 파일에는 변수명과 예시 형태만 작성한다.
- 실제 비밀번호, 토큰 및 Secret Key를 예시 파일에 포함하지 않는다.

**관리 대상 파일**

| 파일 | GitHub 등록 여부 | 설명 |
| --- | --- | --- |
| .env | 금지 | 실제 환경변수 |
| .env.local | 금지 | 로컬 환경변수 |
| .env.development.local | 금지 | 개발 환경 개인 설정 |
| .env.production.local | 금지 | 운영 환경 개인 설정 |
| .env.example | 허용 | 환경변수 이름 및 예시 |
| application-local.yml | 금지 | 개인 DB 및 로컬 설정 정보 포함 가능 |
| application.yml | 조건부 허용 | 민감정보를 포함하지 않는 공통 설정만 허용 |

### 7-2. .gitignore 관리

다음 파일 및 폴더는 Git 추적 대상에서 제외한다.

```
# Environment Variables
.env
.env.*
!.env.example

# Java / Spring
.gradle/
build/
out/
*.class

# Java IDE
.idea/
*.iml
.project
.classpath
.settings/

# Node.js / Next.js
node_modules/
.next/
out/
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Environment-specific files
application-local.yml
application-secret.yml

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temporary files
*.tmp
*.bak
```

※ 프로젝트에서 공통으로 사용하는 설정 파일은 팀원과 협의하여 추적 여부를 결정한다.

### 7-3. 보안 정보 관리

다음 정보는 GitHub에 업로드하지 않는다.

- DB 사용자 계정 및 비밀번호
- JWT Secret Key
- 외부 API 인증 키
- AWS Access Key 및 Secret Key
- 서버 접속 비밀번호
- 개인정보 및 사용자 인증 정보
- 기타 외부에 공개되면 안 되는 민감 정보

### 7-4. 파일 업로드 보안

- 업로드 파일의 확장자와 크기를 검사한다.
- 허용되지 않은 파일 형식은 업로드를 제한한다.
- 사용자가 입력한 파일명을 그대로 저장 경로에 사용하지 않는다.
- 서버에서 파일 저장명을 별도로 생성하는 방식을 사용한다.
- 파일 다운로드 시 사용자의 접근 권한을 확인한다.
- 업로드된 파일이 실행 가능한 파일인지 검증하고 불필요한 실행 권한을 부여하지 않는다.
- 파일 저장 경로에 외부 사용자가 임의로 접근할 수 없도록 관리한다.

### 7-5. 인증 및 개인정보 보안

- 비밀번호는 단방향 해시 방식으로 저장한다.
- JWT Secret Key는 환경변수로 관리한다.
- 로그인되지 않은 사용자의 보호된 API 접근을 제한한다.
- 사용자의 권한을 서버에서 검증한다.
- 인증 토큰 및 비밀번호를 로그에 기록하지 않는다.
- API 응답에 불필요한 개인정보를 포함하지 않는다.

### 7-6. 보안 정보 노출 시 대응

민감한 정보가 GitHub에 업로드된 경우 다음 절차를 따른다.

1. 노출된 Secret Key, 비밀번호 및 토큰을 즉시 폐기하거나 변경한다.
2. 관련 파일을 저장소에서 제거한다.
3. 팀원에게 보안 정보 노출 사실을 공유한다.
4. 필요한 경우 Git 이력까지 정리한다.
5. 변경된 인증 정보를 각 팀원의 로컬 환경에 다시 적용한다.

단순히 파일을 삭제하고 새로운 커밋을 만드는 것만으로 기존 Git 이력에 남은 비밀 정보가 완전히 제거되는 것은 아니므로 주의한다.

---

## 8. 공통 개발 규칙

### 8-1. 코드 작성 전 확인 사항

- 작업할 기능과 관련된 기존 코드를 먼저 확인한다.
- 담당자 간 작업 범위를 명확히 구분한다.
- 공통 DTO, Entity, API 응답 형식 등을 임의로 변경하지 않는다.
- 다른 팀원의 작업과 충돌할 가능성이 있으면 사전에 공유한다.

### 8-2. 코드 작성 후 확인 사항

- 코드 컨벤션을 준수했는지 확인한다.
- 불필요한 주석 및 사용하지 않는 코드를 제거한다.
- 빌드 및 테스트 결과를 확인한다.
- 환경변수와 개인 설정 파일이 포함되지 않았는지 확인한다.
- 작업 내용을 커밋하고 PR을 생성한다.

### 8-3. 팀 협업 원칙

1. 모든 팀원은 동일한 브랜치 전략과 커밋 규칙을 사용한다.
2. 기능별 담당자와 작업 범위를 명확히 한다.
3. 다른 팀원의 코드를 수정해야 할 경우 사전에 공유한다.
4. PR 리뷰에서 지적된 문제는 가능한 한 반영한다.
5. 규칙을 변경할 경우 팀원 모두의 합의를 거친다.
6. 개발 중 문제가 발생하면 혼자 해결하려고 오래 지연시키지 않고 팀에 공유한다.

---

## 9. 최종 체크리스트

### Git 관리

- main과 dev 브랜치를 구분하여 사용했는가?
- 기능별 브랜치를 생성했는가?
- 브랜치 네이밍 규칙을 준수했는가?
- 커밋 메시지 규칙을 준수했는가?
- PR 작성 규칙을 준수했는가?
- 코드 리뷰를 완료했는가?

### 코드 컨벤션

- 파일 및 폴더명 규칙을 준수했는가?
- Java 네이밍 및 계층 구조를 준수했는가?
- JavaScript/Next.js 컴포넌트 및 Hook 규칙을 준수했는가?
- 중복 코드 및 불필요한 코드를 제거했는가?
- 테스트 및 빌드가 정상적으로 완료되었는가?

### 보안 관리

- 실제 .env 파일이 포함되지 않았는가?
- DB 비밀번호와 JWT Secret Key가 노출되지 않았는가?
- API 인증 정보가 포함되지 않았는가?
- 개인 설정 파일이 포함되지 않았는가?
- 파일 업로드 및 접근 권한을 확인했는가?

---

## 10. 최종 운영 원칙

모든 팀원은 본 문서에 정의된 Git 및 코드 컨벤션을 준수한다.

프로젝트 진행 중 규칙 변경이 필요한 경우 팀원 간 협의를 통해 변경하고, 변경된 내용은 문서에 반영한다.

본 컨벤션은 PoketHub 프로젝트의 코드 품질과 협업 효율을 높이고, 팀원 간 개발 방식의 차이를 최소화하는 것을 목적으로 한다.