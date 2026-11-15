package com.pockethub.common.exception;

import com.pockethub.common.response.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
            IllegalArgumentException exception, WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), extractPath(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // TODO : 처리할 예외들 작성

    // 나머지 모든 익셉션 처리
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
//            Exception exception, WebRequest request
//    ) {
//        ErrorResponse response = new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage(), extractPath(request));
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
//    }

    private String extractPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
