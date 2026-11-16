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
    public static final int PASSWORD_MIN = 8;
    public static final int PASSWORD_MAX = 64;
    public static final String PASSWORD_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d\\p{Punct}]+$";
    public static final int NICKNAME_MIN = 2;
    public static final int NICKNAME_MAX = 45;
    public static final String NICKNAME_PATTERN = "^[가-힣a-zA-Z0-9]+$";

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
