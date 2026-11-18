package com.pockethub.team.dto;

import com.pockethub.team.domain.Repo;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class TeamResponse {

    private final Long teamId;
    private final String name;
    private final String description;
    private final Long ownerId;
    private final LocalDateTime createdAt;
    private final long memberCount;

    public TeamResponse(Repo repo, long memberCount) {
        this.teamId = repo.getId();
        this.name = repo.getName();
        this.description = repo.getDescription();
        this.ownerId = repo.getOwner().getId();
        this.createdAt = repo.getCreatedAt();
        this.memberCount = memberCount;
    }

}
