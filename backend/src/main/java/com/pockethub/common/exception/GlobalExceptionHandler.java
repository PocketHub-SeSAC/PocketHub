package com.pockethub.common.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.pockethub.common.response.ErrorResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Arrays;
import java.util.stream.Collectors;

@Log4j2
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
            IllegalArgumentException exception, WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), extractPath(request));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handlerNotFound(
            NotFoundException exception, WebRequest request
    ) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handlerForbidden(
            ForbiddenException exception, WebRequest request
    ) {
        return error(HttpStatus.FORBIDDEN, exception.getMessage(), request);
    }

    // @Valid 검증 실패: 첫 번째 필드 오류 메시지를 돌려준다
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handlerMethodArgumentNotValid(
            MethodArgumentNotValidException exception, WebRequest request
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("요청 값이 올바르지 않습니다.");
        return error(HttpStatus.BAD_REQUEST, message, request);
    }

    // JSON 형식 오류, enum 에 없는 값, 날짜 형식 오류
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handlerHttpMessageNotReadable(
            HttpMessageNotReadableException exception, WebRequest request
    ) {
        String message = "요청 본문 형식이 올바르지 않습니다.";
        if (exception.getCause() instanceof InvalidFormatException cause && !cause.getPath().isEmpty()) {
            String field = cause.getPath().get(cause.getPath().size() - 1).getFieldName();
            Class<?> targetType = cause.getTargetType();
            message = targetType.isEnum()
                    ? field + " 값은 " + allowedValues(targetType) + " 중 하나여야 합니다."
                    : field + " 형식이 올바르지 않습니다.";
        }
        return error(HttpStatus.BAD_REQUEST, message, request);
    }

    // 쿼리·경로 값의 타입 오류 (예: ?status=WRONG)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handlerMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException exception, WebRequest request
    ) {
        Class<?> requiredType = exception.getRequiredType();
        String message = (requiredType != null && requiredType.isEnum())
                ? exception.getName() + " 값은 " + allowedValues(requiredType) + " 중 하나여야 합니다."
                : exception.getName() + " 값이 올바르지 않습니다.";
        return error(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handlerConflict(
            ConflictException exception, WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(HttpStatus.CONFLICT, exception.getMessage(), extractPath(request));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(FileNotCreatedException.class)
    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
            FileNotCreatedException exception, WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage(), extractPath(request));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(FileNotCleanupException.class)
    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
            FileNotCleanupException exception, WebRequest request
    ) {
        ErrorResponse response = new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage(), extractPath(request));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handlerUnauthorized(
            UnauthorizedException exception, WebRequest request
    ) {
        return error(HttpStatus.UNAUTHORIZED, exception.getMessage(), request);
    }

    // TODO : 처리할 예외들 작성

    // 나머지 모든 런타임 익셉션 처리
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handlerIllegalArgument(
            RuntimeException exception, WebRequest request
    ) {
        log.error("e: ", exception);
        ErrorResponse response = new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "정의되지 않은 서버 내부 오류가 발생했습니다.", extractPath(request));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private ResponseEntity<ErrorResponse> error(HttpStatus status, String message, WebRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponse(status, message, extractPath(request)));
    }

    private String allowedValues(Class<?> enumType) {
        return Arrays.stream(enumType.getEnumConstants())
                .map(Object::toString)
                .collect(Collectors.joining("/"));
    }

    private String extractPath(WebRequest request) {
        return request.getDescription(false).replace("uri=", "");
    }
}
