package com.pockethub.common.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

public class ErrorResponse extends ResponseDTO{
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp;
    private final String error;
    private final String path;

    public ErrorResponse(HttpStatus httpStatus, String message, String path) {
        super(httpStatus, message);
        this.timestamp = LocalDateTime.now();
        this.error = httpStatus.getReasonPhrase();
        this.path = path;
    }
}
