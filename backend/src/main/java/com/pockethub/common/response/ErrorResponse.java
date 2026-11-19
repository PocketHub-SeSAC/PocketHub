package com.pockethub.common.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Getter
@Setter
public class ErrorResponse{
    private final boolean success;
    private final int status;
    private final String message;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime timestamp;
    private final String error;
    private final String path;

    public ErrorResponse(HttpStatus httpStatus, String message, String path) {
        this.success = !httpStatus.isError();
        this.status = httpStatus.value();
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.error = httpStatus.getReasonPhrase();
        this.path = path;
    }
}
