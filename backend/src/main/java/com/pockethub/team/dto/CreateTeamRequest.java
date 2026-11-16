package com.pockethub.team.dto;

// 팀 생성

import com.pockethub.team.domain.Repo;
import com.pockethub.user.domain.User;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Getter
@NoArgsConstructor
public class CreateTeamRequest {

    private String name;
    private String description;

    public Repo toEntity(User owner){
        return new Repo(name, description, owner);
    }

}
