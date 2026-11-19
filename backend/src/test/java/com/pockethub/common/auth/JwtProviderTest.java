package com.pockethub.common.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class JwtProviderTest {

    private static final String SECRET = "test-only-secret-key-0123456789-abcdefghij";
    private static final String OTHER_SECRET = "another-test-secret-key-9876543210-zyxwvu";
    private static final long EXPIRATION_MINUTES = 60;
    private static final long ALREADY_EXPIRED_MINUTES = -1;
    private static final Long USER_ID = 1L;

    private final JwtProvider jwtProvider = new JwtProvider(SECRET, EXPIRATION_MINUTES);

    @Test
    @DisplayName("발급한 토큰에서 userId 를 꺼낼 수 있다")
    void createAndRead() {
        String token = jwtProvider.createAccessToken(USER_ID);

        assertThat(jwtProvider.isValid(token)).isTrue();
        assertThat(jwtProvider.getUserId(token)).isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("내용이 바뀐 토큰은 유효하지 않다")
    void tamperedToken() {
        String token = jwtProvider.createAccessToken(USER_ID);
        String tampered = token.substring(0, token.length() - 1)
                + (token.endsWith("A") ? "B" : "A");

        assertThat(jwtProvider.isValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("다른 비밀키로 만든 토큰은 유효하지 않다")
    void otherSecretToken() {
        JwtProvider otherProvider = new JwtProvider(OTHER_SECRET, EXPIRATION_MINUTES);
        String token = otherProvider.createAccessToken(USER_ID);

        assertThat(jwtProvider.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("만료된 토큰은 유효하지 않다")
    void expiredToken() {
        JwtProvider expiredProvider = new JwtProvider(SECRET, ALREADY_EXPIRED_MINUTES);
        String token = expiredProvider.createAccessToken(USER_ID);

        assertThat(jwtProvider.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("토큰 형식이 아니거나 비어 있으면 유효하지 않다")
    void malformedToken() {
        assertThat(jwtProvider.isValid("not-a-jwt")).isFalse();
        assertThat(jwtProvider.isValid("")).isFalse();
        assertThat(jwtProvider.isValid(null)).isFalse();
    }

    @Test
    @DisplayName("비밀키가 32바이트보다 짧으면 생성할 수 없다")
    void weakSecret() {
        assertThatThrownBy(() -> new JwtProvider("short-secret", EXPIRATION_MINUTES))
                .isInstanceOf(WeakKeyException.class);
    }
}