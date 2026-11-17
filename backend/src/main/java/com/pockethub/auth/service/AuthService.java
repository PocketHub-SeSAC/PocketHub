package com.pockethub.auth.service;

import com.pockethub.auth.domain.RefreshToken;
import com.pockethub.auth.dto.LoginRequest;
import com.pockethub.auth.dto.LoginResponse;
import com.pockethub.auth.repository.RefreshTokenRepository;
import com.pockethub.common.auth.JwtProvider;
import com.pockethub.common.auth.RefreshTokenProvider;
import com.pockethub.common.exception.UnauthorizedException;
import com.pockethub.user.domain.User;
import com.pockethub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenProvider refreshTokenProvider;
    private final JwtProvider jwtProvider;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 이메일로 사용자 검증
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다"));

        // 비밀번호 검증
        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다");
        }

        String accessToken = jwtProvider.createAccessToken(user.getId());
        String refreshToken = refreshTokenProvider.createToken();

        refreshTokenRepository.save(
                new RefreshToken(
                        user.getId(),
                        refreshTokenProvider.hash(refreshToken),
                        LocalDateTime.now().plus(refreshTokenProvider.getExpiration())
                )
        );

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProvider.getAccessExpirationSeconds())
                .memberId(user.getId())
                .nickname(user.getNickname())
                .build();
    }
}
