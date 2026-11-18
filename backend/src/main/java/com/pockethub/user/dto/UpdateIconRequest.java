package com.pockethub.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UpdateIconRequest {

    @Size(max = 45, message = "아이콘 이름은 45자 이하로 입력해주세요")
    private String profileIcon;
}
