package com.pockethub.auth.controller;

import com.pockethub.auth.dto.LoginRequest;
import com.pockethub.auth.dto.LoginResponse;
import com.pockethub.auth.service.AuthService;
import com.pockethub.common.auth.RefreshTokenProvider;
import com.pockethub.common.response.ResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenProvider refreshTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ResponseDTO> login(@Valid @RequestBody LoginRequest request) {
        return tokenResponse(authService.login(request), "로그인에 성공했습니다");
    }

    @PostMapping("/reissue")
    public ResponseEntity<ResponseDTO> reissue(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        return tokenResponse(authService.reissue(refreshToken), "토큰이 재발급되었습니다");
    }

    @PostMapping("/logout")
    public ResponseEntity<ResponseDTO> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        authService.logout(refreshToken);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .body(new ResponseDTO(HttpStatus.OK, "로그아웃되었습니다"));
    }

    private ResponseEntity<ResponseDTO> tokenResponse(LoginResponse result, String message) {

        ResponseDTO response = new ResponseDTO(
                Map.of(
                        "accessToken", result.getAccessToken(),
                        "tokenType", "Bearer",
                        "expiresIn", result.getExpiresIn(),
                        "memberId", result.getMemberId(),
                        "nickname", result.getNickname()
                ),
                message
        );

        ResponseCookie cookie = refreshCookie(result.getRefreshToken(), refreshTokenProvider.getExpiration());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from("refreshToken", value)
                .httpOnly(true)
                .path("/api/v1/auth")
                .sameSite("Strict")
                .maxAge(maxAge)
                .build();
    }
}
