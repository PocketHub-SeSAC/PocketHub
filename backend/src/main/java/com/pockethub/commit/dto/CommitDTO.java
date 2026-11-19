package com.pockethub.commit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pockethub.commit.domain.Commit;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.user.dto.UserResponse;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
public class CommitDTO {
    private String commitId;
    private String message;
    private UserResponse user;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    private List<FileDTO> files;
    private Long prId;

    public CommitDTO(String commitId, String commitMessage) {
        this.commitId = commitId;
        this.message = commitMessage;
    }

    public CommitDTO(Commit commit) {
        this.commitId = commit.getCommitId();
        this.message = commit.getMessage();
        if(commit.getUser() != null)
            this.user = UserResponse.from(commit.getUser());
        this.createdAt = commit.getCreatedAt();
        this.files = commit.getFiles().stream()
                .map(FileDTO::new).toList();
        this.prId = commit.getPrId();
    }
}
