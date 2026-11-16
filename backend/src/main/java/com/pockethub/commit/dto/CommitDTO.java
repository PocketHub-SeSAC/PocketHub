package com.pockethub.commit.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pockethub.commit.domain.Commit;
import com.pockethub.file.dto.FileDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
public class CommitDTO {
    private String commitId;
    private String message;
    private Long authorId;    // TODO : UserDTO 객체로 바뀜
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    private List<FileDTO> files;

    public CommitDTO(String commitId, String commitMessage) {
        this.commitId = commitId;
        this.message = commitMessage;
    }

    public CommitDTO(Commit commit) {
        this.commitId = commit.getCommitId();
        this.message = commit.getMessage();
        this.authorId = commit.getUserId();
        this.createdAt = commit.getCreatedAt();
        this.files = commit.getFiles().stream()
                .map(FileDTO::new).toList();
    }
}
