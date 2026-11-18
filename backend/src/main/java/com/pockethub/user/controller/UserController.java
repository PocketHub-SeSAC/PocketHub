package com.pockethub.user.controller;

import com.pockethub.common.response.ResponseDTO;
import com.pockethub.user.dto.SignupRequest;
import com.pockethub.user.dto.UpdateIconRequest;
import com.pockethub.user.dto.UserResponse;
import com.pockethub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
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

    @GetMapping("/me")
    public ResponseEntity<ResponseDTO> getMyInfo(
            @AuthenticationPrincipal Long userId
    ) {
        UserResponse user = userService.getMyInfo(userId);

        ResponseDTO response = new ResponseDTO(toData(user), "내 정보 조회에 성공했습니다");

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<ResponseDTO> changeIcon(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateIconRequest request
    ) {
        UserResponse user = userService.updateIcon(userId, request);

        ResponseDTO response = new ResponseDTO(toData(user), "아이콘 수정에 성공했습니다");

        return ResponseEntity.ok(response);
    }

    // icon이 null인 경우가 있어 LinkedHashMap 사용
    private Map<String, Object> toData(UserResponse user) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("memberId", user.getUserId());
        data.put("email", user.getEmail());
        data.put("nickname", user.getNickname());
        data.put("icon", user.getIcon());

        return data;
    }
}
