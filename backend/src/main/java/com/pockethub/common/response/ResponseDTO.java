package com.pockethub.common.response;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Setter
@Getter
public class ResponseDTO {
    private boolean success;
    private int status;
    private String message;
    private Object data;

    public ResponseDTO() {
    }

    public ResponseDTO(Object data) {
        this.data = data;
        this.success = true;
        this.status = 200;
    }

    public ResponseDTO(Object data, String message) {
        this.data = data;
        this.message = message;
        this.success = true;
        this.status = 200;
    }

    public ResponseDTO(HttpStatus httpStatus, String message) {
        this.success = !httpStatus.isError();
        this.status = httpStatus.value();
        this.message = message;
    }

    public ResponseDTO(HttpStatus httpStatus, Object data, String message) {
        this.success = !httpStatus.isError();
        this.status = httpStatus.value();
        this.message = message;
        this.data = data;
    }
}
