-- PoketHub MySQL 스키마 (ERD 11/11 버전 + 합의된 수정 반영)
-- '팀 확정 전' 표시는 아직 팀에서 정하지 않은 항목이라 정해지면 바꿔야 함

CREATE DATABASE IF NOT EXISTS pockethub
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pockethub;

-- 회원 (user는 예약어 충돌을 피하려고 users)
CREATE TABLE users (
  user_id      BIGINT       NOT NULL AUTO_INCREMENT,
  email        VARCHAR(255) NOT NULL,
  password     VARCHAR(255) NOT NULL,            -- BCrypt(60자)
  nickname     VARCHAR(45)  NOT NULL,
  profile_icon VARCHAR(45)  NOT NULL DEFAULT 'dino',  -- 프로필 아이콘 이름 (팀 확정 전)
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

-- 저장소(팀)
CREATE TABLE repositories (
  repo_id   BIGINT      NOT NULL AUTO_INCREMENT,
  repo_name VARCHAR(45) NOT NULL,
  user_id   BIGINT      NOT NULL,                -- 저장소 소유자
  PRIMARY KEY (repo_id),
  CONSTRAINT fk_repo_owner FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- 팀 저장소 관계(팀원)
CREATE TABLE collaborators (
  collaborator_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id         BIGINT NOT NULL,
  repo_id         BIGINT NOT NULL,
  PRIMARY KEY (collaborator_id),
  UNIQUE KEY uk_collab (repo_id, user_id),
  CONSTRAINT fk_collab_user FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_collab_repo FOREIGN KEY (repo_id) REFERENCES repositories (repo_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Task
CREATE TABLE tasks (
  task_id    BIGINT        NOT NULL AUTO_INCREMENT,
  title      VARCHAR(100)  NOT NULL,
  text       VARCHAR(4000) NOT NULL,
  status     VARCHAR(45)   NOT NULL DEFAULT 'TODO',    -- TODO, DOING, DONE
  priority   VARCHAR(45)   NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH
  manager_id BIGINT        NULL,                       -- 담당자(미지정 가능), 팀원 삭제 시 서비스 코드에서 NULL 처리
  repo_id    BIGINT        NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at     DATETIME      NULL,
  PRIMARY KEY (task_id),
  CONSTRAINT fk_task_manager FOREIGN KEY (manager_id) REFERENCES users (user_id),
  CONSTRAINT fk_task_repo FOREIGN KEY (repo_id) REFERENCES repositories (repo_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- PR
CREATE TABLE pull_requests (
  pr_id       BIGINT        NOT NULL AUTO_INCREMENT,
  title       VARCHAR(100)  NOT NULL,
  text        VARCHAR(4000) NULL,
  state       VARCHAR(45)   NOT NULL DEFAULT 'OPEN',   -- OPEN, APPROVED, REJECTED
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_at      DATETIME      NULL,
  task_id     BIGINT        NULL,                      -- 팀 확정 전: Task 삭제 시 PR은 남기고 NULL
  repo_id     BIGINT        NOT NULL,
  user_id     BIGINT        NOT NULL,                  -- PR 작성자
  approver_id BIGINT        NULL,                      -- 승인·거부한 팀원
  PRIMARY KEY (pr_id),
  CONSTRAINT fk_pr_task FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE SET NULL,
  CONSTRAINT fk_pr_repo FOREIGN KEY (repo_id) REFERENCES repositories (repo_id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_pr_approver FOREIGN KEY (approver_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- 커밋 (pr_id는 NULL 허용: 업로드하면 커밋이 먼저 생기고 PR은 나중에 묶임)
CREATE TABLE commits (
  commit_id  BIGINT       NOT NULL AUTO_INCREMENT,
  message    VARCHAR(500) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id    BIGINT       NOT NULL,
  repo_id    BIGINT       NOT NULL,
  pr_id      BIGINT       NULL,
  PRIMARY KEY (commit_id),
  CONSTRAINT fk_commit_user FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_commit_repo FOREIGN KEY (repo_id) REFERENCES repositories (repo_id) ON DELETE CASCADE,
  CONSTRAINT fk_commit_pr FOREIGN KEY (pr_id) REFERENCES pull_requests (pr_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 파일 (커밋 1개에 파일 여러 개)
CREATE TABLE files (
  file_id       BIGINT        NOT NULL AUTO_INCREMENT,
  original_name VARCHAR(200)  NOT NULL,
  saved_name    VARCHAR(200)  NOT NULL,
  state         VARCHAR(45)   NOT NULL,                -- 값 목록은 팀 확정 전 (목업 표시: 추가 등)
  file_path     VARCHAR(1000) NOT NULL,
  size          BIGINT        NOT NULL,                -- 바이트 단위
  is_latest     BOOLEAN       NOT NULL DEFAULT TRUE,
  commit_id     BIGINT        NOT NULL,
  repo_id       BIGINT        NOT NULL,
  prev_id       BIGINT        NULL,                    -- 이전 버전 파일
  PRIMARY KEY (file_id),
  CONSTRAINT fk_file_commit FOREIGN KEY (commit_id) REFERENCES commits (commit_id) ON DELETE CASCADE,
  CONSTRAINT fk_file_repo FOREIGN KEY (repo_id) REFERENCES repositories (repo_id) ON DELETE CASCADE,
  CONSTRAINT fk_file_prev FOREIGN KEY (prev_id) REFERENCES files (file_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 리뷰 (PR 거부 사유도 리뷰 댓글로 저장)
CREATE TABLE reviews (
  review_id  BIGINT        NOT NULL AUTO_INCREMENT,
  comment    VARCHAR(4000) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id    BIGINT        NOT NULL,
  pr_id      BIGINT        NOT NULL,
  PRIMARY KEY (review_id),
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_review_pr FOREIGN KEY (pr_id) REFERENCES pull_requests (pr_id) ON DELETE CASCADE
) ENGINE=InnoDB;
