package com.pockethub.user.dto;

import com.pockethub.user.domain.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private Long userId;
    private String email;
    private String nickname;
    private String icon;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .icon(user.getIcon())
                .build();
    }
}
