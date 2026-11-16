package com.pockethub.pr.controller;

import com.pockethub.common.response.ErrorResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.server.ResponseStatusException;

// PR 컨트롤러 전용 403·404·409 처리 (공통 GlobalExceptionHandler 는 400 만 있어서 PR 쪽에서만 적용)
// TODO : 공통 NotFoundException·ForbiddenException 이 dev 에 머지되면 그쪽으로 바꾸고 이 파일 삭제
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = PrController.class)
public class PrExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException exception, WebRequest request) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String path = request.getDescription(false).replace("uri=", "");
        return ResponseEntity.status(status).body(new ErrorResponse(status, exception.getReason(), path));
    }
}
