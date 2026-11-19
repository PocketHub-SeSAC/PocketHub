package com.pockethub.common.exception;

// 로그인은 했지만 권한이 없을 때(예: 팀원이 아님) 403 으로 응답한다
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
