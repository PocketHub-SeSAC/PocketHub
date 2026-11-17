package com.pockethub.common.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final Duration accessExpiration;

    // 설정값을 통한 생성자
    public JwtProvider(@Value("${jwt.secret}") String secretKey, @Value("${jwt.access-expiration-minutes}") long accessExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        this.accessExpiration = Duration.ofMinutes(accessExpiration);
    }

    // 토큰 생성
    public String createAccessToken(Long userId) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + accessExpiration.toMillis());

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(secretKey)
                .compact();
    }

    // 유효 시간
    public long getAccessExpirationSeconds() {
        return accessExpiration.toSeconds();
    }

    // 토큰 검사
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 유효한지 확인
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // userId 추출
    public Long getUserId(String token) {
        return Long.valueOf(parseClaims(token).getSubject());
    }
}
