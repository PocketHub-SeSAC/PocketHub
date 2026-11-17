package com.pockethub.team.dto;

// 팀 수정(PATCH)

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateTeamRequest {
    private String name;
    private String description;
}
