package com.pockethub.common.response;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

@Setter
@Getter
public class ResponseDTO {
    private boolean success;
    private int status;
    private String message;
    private Map<String, Object> data = new HashMap<>();

    public ResponseDTO() {
    }

    public ResponseDTO(Map<String, Object> data) {
        this.data = data;
        this.success = true;
        this.status = 200;
    }

    public ResponseDTO(Map<String, Object> data, String message) {
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

    public ResponseDTO(HttpStatus httpStatus, Map<String, Object> data, String message) {
        this.success = !httpStatus.isError();
        this.status = httpStatus.value();
        this.message = message;
        this.data = data;
    }
}
