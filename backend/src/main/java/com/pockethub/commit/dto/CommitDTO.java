package com.pockethub.commit.dto;

import com.pockethub.commit.domain.Commit;
import com.pockethub.file.dto.FileDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class CommitDTO {
    private String commitId;
    private String commitMessage;
    private Long userId;    // TODO : UserDTO 객체로 바뀜
    private List<FileDTO> files;

    public CommitDTO(String commitId, String commitMessage) {
        this.commitId = commitId;
        this.commitMessage = commitMessage;
    }

    public CommitDTO(Commit commit) {
        this.commitId = commit.getCommitId();
        this.commitMessage = commit.getMessage();
        this.userId = commit.getUserId();
        this.files = commit.getFiles().stream()
                .map(FileDTO::new).toList();
    }
}
