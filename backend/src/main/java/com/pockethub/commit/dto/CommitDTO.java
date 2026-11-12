package com.pockethub.commit.dto;

import com.pockethub.file.dto.FileDTO;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Setter
@Getter
public class CommitDTO {
    private String commitId;
    private String commitMessage;
    private List<FileDTO> files;

    public CommitDTO(String commitId, String commitMessage) {
        this.commitId = commitId;
        this.commitMessage = commitMessage;
    }
}
