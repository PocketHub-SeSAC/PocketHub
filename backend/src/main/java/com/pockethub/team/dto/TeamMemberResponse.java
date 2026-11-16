package com.pockethub.team.dto;

// 팀원 목록 응답

import com.pockethub.team.domain.Collaborator;
import com.pockethub.team.domain.User;
import lombok.Getter;


@Getter
public class TeamMemberResponse {
    private final Long userId;
    private final String nickname;
    private final String icon;


    public TeamMemberResponse(Collaborator collaborator){
        User user = collaborator.getUser();
        this.userId = user.getId();
        this.nickname = user.getNickname();
        this.icon = user.getIcon();
    }

}