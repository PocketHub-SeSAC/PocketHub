package com.pockethub.file.dto;

import com.pockethub.commit.dto.FileState;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FileDTO {
    private long fileId;
    private String originalName;
    private String filePath;
    private String commitId;
    private long repoId;
    private float size;
    private FileState state;
    private Long prevId;
    private Boolean isLatest;

    public FileDTO() {
    }

    public FileDTO(String originalName, String filePath, String commitId, long repoId, float size) {
        this.originalName = originalName;
        this.filePath = filePath;
        this.repoId = repoId;
        this.commitId = commitId;
        this.size = size;
    }
}
