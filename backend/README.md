# PoketHub Backend

포켓헙 백엔드 뼈대. 아직 API·엔티티·공통 응답·인증·예외 처리는 없음 (별도 작업).

## 기술
Java 21 · Spring Boot 3.5 · Gradle · MySQL 8 · Spring Data JPA · Validation · Lombok · spring-security-crypto(BCrypt 전용)

## 구조
```
src/main/java/com/pockethub
├─ common/  response · exception · config · auth · validation(ValidationRules)
└─ member · team · file · commit · task · pr · review
     └─ controller · service · repository · domain · dto
db/schema.sql      MySQL 에서 직접 실행 (앱이 자동 실행하지 않음)
```

## 요구사항
- **JDK 21** (빌드는 Gradle toolchain 으로 Java 21 을 사용. PC 에 JDK 21 이 없으면 빌드가 실패함)
- MySQL 8

## 로컬 실행
1. DB 만들기 + 스키마 실행
   ```sql
   CREATE DATABASE pockethub DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   ```bash
   mysql -u <사용자> -p pockethub < db/schema.sql
   ```
2. 환경변수 설정 (`.env.example` 참고, 비밀번호는 파일에 커밋하지 않음)
   ```powershell
   $env:DB_USERNAME="..."; $env:DB_PASSWORD="..."
   ```
3. 실행: `./gradlew bootRun` (포트 8080)

빌드(`./gradlew build`)는 DB 없이도 됩니다.

## 설정 메모
- `spring.jpa.hibernate.ddl-auto=none`, `spring.sql.init.mode=never` — 스키마는 사람이 직접 반영
- `upload.max-size`, `upload.allowed-extensions` — 팀 확정 후 채울 것 (TODO)
- 입력 길이 제한은 `common/validation/ValidationRules` 상수 사용, 값은 DB 컬럼 길이와 맞춤
