-- PoketHub MySQL 스키마 (팀 테이블 정의서 11/11 반영)
-- 기존 DB가 있으면 먼저 삭제 후 실행: DROP DATABASE pockethub;
-- '팀 확정 전' 표시는 정의서에 명시되지 않아 임시로 정한 부분

CREATE DATABASE IF NOT EXISTS pockethub
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pockethub;

-- 회원
CREATE TABLE `user` (
  user_id  BIGINT       NOT NULL AUTO_INCREMENT,
  email    VARCHAR(255) NOT NULL,            -- 정의서는 45자지만 255로 변경
  password VARCHAR(255) NOT NULL,            -- BCrypt(60자)
  nickname VARCHAR(45)  NOT NULL,
  icon     VARCHAR(45)  NULL,                -- 프로필 아이콘 이름
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_user_email (email),
  UNIQUE KEY uk_user_nickname (nickname)
) ENGINE=InnoDB;

-- 저장소(팀): 소유 회원이 사라져도 저장소는 사라지면 안 되므로 CASCADE 없음
CREATE TABLE repository (
  repo_id     BIGINT        NOT NULL AUTO_INCREMENT,
  repo_name   VARCHAR(45)   NOT NULL,
  user_id     BIGINT        NOT NULL,
  description VARCHAR(1000) NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (repo_id),
  CONSTRAINT fk_repository_user FOREIGN KEY (user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB;

-- 팀원-저장소 관계
CREATE TABLE collaborator (
  collaborator_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id         BIGINT NOT NULL,
  repo_id         BIGINT NOT NULL,
  PRIMARY KEY (collaborator_id),
  UNIQUE KEY uk_collaborator (repo_id, user_id),   -- 정의서에 없음, 같은 팀원 중복 방지용(팀 확정 전)
  CONSTRAINT fk_collaborator_user FOREIGN KEY (user_id) REFERENCES `user` (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_collaborator_repo FOREIGN KEY (repo_id) REFERENCES repository (repo_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Task
CREATE TABLE task (
  task_id    BIGINT        NOT NULL AUTO_INCREMENT,
  title      VARCHAR(100)  NOT NULL,
  text       VARCHAR(4000) NOT NULL,
  status     VARCHAR(45)   NOT NULL DEFAULT 'TODO',    -- TODO, DOING, DONE
  priority   VARCHAR(45)   NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH
  manager_id BIGINT        NULL,                       -- 담당자(미지정 가능)
  repo_id    BIGINT        NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at     DATETIME      NULL,
  PRIMARY KEY (task_id),
  CONSTRAINT fk_task_manager FOREIGN KEY (manager_id) REFERENCES `user` (user_id),
  CONSTRAINT fk_task_repo FOREIGN KEY (repo_id) REFERENCES repository (repo_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- PR
-- task_id는 NULL 허용: Task를 삭제해도 PR은 남고 task_id만 NULL이 됨 (ON DELETE SET NULL)
-- 정의서에 없던 repo_id 추가: Task가 삭제돼 task_id가 NULL이 돼도 PR이 어느 팀 것인지 알아야
-- 팀별 PR 목록 조회와 팀 삭제 시 PR 정리가 가능함 (팀 확정 전)
CREATE TABLE pr (
  pr_id       BIGINT        NOT NULL AUTO_INCREMENT,
  title       VARCHAR(100)  NOT NULL,
  text        VARCHAR(4000) NOT NULL,
  state       VARCHAR(45)   NOT NULL DEFAULT 'OPEN',   -- OPEN, APPROVE, DENIED
  repo_id     BIGINT        NOT NULL,
  task_id     BIGINT        NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at      DATETIME      NULL,                      -- 승인/거부 시각
  approver_id BIGINT        NULL,                      -- 승인자/거부자
  user_id     BIGINT        NOT NULL,                  -- 작성자
  reply       VARCHAR(4000) NULL,
  PRIMARY KEY (pr_id),
  CONSTRAINT fk_pr_repo FOREIGN KEY (repo_id) REFERENCES repository (repo_id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_task FOREIGN KEY (task_id) REFERENCES task (task_id) ON DELETE SET NULL,
  CONSTRAINT fk_pr_approver FOREIGN KEY (approver_id) REFERENCES `user` (user_id),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB;

-- 커밋: pr_id는 NULL 허용, PR 삭제 시 NULL
CREATE TABLE `commit` (
  commit_id  VARCHAR(45)  NOT NULL,
  repo_id    BIGINT       NOT NULL,
  pr_id      BIGINT       NULL,
  message    VARCHAR(500) NOT NULL,
  user_id    BIGINT       NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (commit_id),
  CONSTRAINT fk_commit_repo FOREIGN KEY (repo_id) REFERENCES repository (repo_id) ON DELETE CASCADE,
  CONSTRAINT fk_commit_pr FOREIGN KEY (pr_id) REFERENCES pr (pr_id) ON DELETE SET NULL,
  CONSTRAINT fk_commit_user FOREIGN KEY (user_id) REFERENCES `user` (user_id)
) ENGINE=InnoDB;

-- 파일 (커밋 1개에 파일 여러 개)
CREATE TABLE `file` (
  file_id       BIGINT        NOT NULL AUTO_INCREMENT,
  file_path     VARCHAR(1000) NOT NULL,
  original_name VARCHAR(200)  NOT NULL,
  state         VARCHAR(45)   NOT NULL,                -- ADD, UPDATE, DELETE
  repo_id       BIGINT        NOT NULL,
  size          FLOAT         NOT NULL DEFAULT 0,      -- KB 단위
  commit_id     VARCHAR(45)   NULL,
  is_latest     TINYINT(1)    NOT NULL DEFAULT 0,
  prev_id       BIGINT        NULL,                    -- UPDATE/DELETE 파일의 이전 상태 파일
  PRIMARY KEY (file_id),
  CONSTRAINT fk_file_repo FOREIGN KEY (repo_id) REFERENCES repository (repo_id) ON DELETE CASCADE,
  -- 팀 삭제 때 commit과 file이 함께 지워져도 오류가 나지 않게 CASCADE / SET NULL (정의서에는 FK로만 표기됨)
  CONSTRAINT fk_file_commit FOREIGN KEY (commit_id) REFERENCES `commit` (commit_id) ON DELETE CASCADE,
  CONSTRAINT fk_file_prev FOREIGN KEY (prev_id) REFERENCES `file` (file_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 리뷰
CREATE TABLE review (
  review_id  BIGINT        NOT NULL AUTO_INCREMENT,
  user_id    BIGINT        NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  comment    VARCHAR(4000) NOT NULL,
  pr_id      BIGINT        NOT NULL,
  PRIMARY KEY (review_id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES `user` (user_id),
  CONSTRAINT fk_review_pr FOREIGN KEY (pr_id) REFERENCES pr (pr_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 리프레시 토큰
CREATE TABLE refresh_token (
  refresh_id BIGINT        NOT NULL AUTO_INCREMENT,
  user_id    BIGINT        NOT NULL,
  token_hash VARCHAR(1000) NOT NULL,
  expired_at DATETIME      NULL,
  PRIMARY KEY (refresh_id),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES `user` (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
