package com.pockethub.team.dto;

// 팀원 추가

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AddMemberRequest {
    private String email;
}
