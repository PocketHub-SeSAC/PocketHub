package com.pockethub.common.validation;

/**
 * 입력 검증 길이 상수. 값은 DB 컬럼 길이(db/schema.sql)와 같게 유지한다.
 * DTO 에서 {@code @Size(max = ValidationRules.NICKNAME_MAX)} 처럼 쓴다.
 */
public final class ValidationRules {

    private ValidationRules() {
    }

    // 회원
    public static final int EMAIL_MAX = 255;
    /* 비밀번호 규칙은 팀 확정 전 (길이 외 조합 규칙 미정).
       MAX 72 는 BCrypt 가 72바이트까지만 쓰기 때문. */
    public static final int PASSWORD_MIN = 8;
    public static final int PASSWORD_MAX = 72;
    public static final int NICKNAME_MAX = 45;

    // 팀(저장소)
    public static final int REPO_NAME_MAX = 45;
    public static final int REPO_DESCRIPTION_MAX = 1000;

    // Task
    public static final int TASK_TITLE_MAX = 100;
    public static final int TASK_TEXT_MAX = 4000;

    // PR · 리뷰
    public static final int PR_TITLE_MAX = 100;
    public static final int PR_TEXT_MAX = 4000;
    public static final int REVIEW_COMMENT_MAX = 4000;

    // 커밋
    public static final int COMMIT_MESSAGE_MAX = 500;
}
