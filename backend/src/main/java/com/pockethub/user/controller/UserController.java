package com.pockethub.user.controller;

import com.pockethub.common.response.ResponseDTO;
import com.pockethub.user.dto.SignupRequest;
import com.pockethub.user.dto.UserResponse;
import com.pockethub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/members")
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ResponseDTO> signup(@Valid @RequestBody SignupRequest request) {
        UserResponse user = userService.signup(request);
        ResponseDTO response = new ResponseDTO(HttpStatus.CREATED, Map.of("user", user), "회원가입이 완료되었습니다");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
