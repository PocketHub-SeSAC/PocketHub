package com.pockethub.auth.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refresh_id")
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String tokenHash;

    private LocalDateTime expiredAt;

    public RefreshToken(Long userId, String tokenHash, LocalDateTime expiredAt) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.expiredAt = expiredAt;
    }

    public boolean isExpired(LocalDateTime now) {
        return expiredAt != null && expiredAt.isBefore(now);
    }
}
