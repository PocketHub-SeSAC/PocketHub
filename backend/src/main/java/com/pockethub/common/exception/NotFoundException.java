package com.pockethub.common.exception;

// 요청한 대상(팀, Task 등)이 없을 때 404 로 응답한다
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
