package com.pockethub.file.dto;

import com.pockethub.commit.domain.Commit;
import com.pockethub.file.domain.File;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class FileDTO {
    private long fileId;
    private String fileName;
    private String filePath;
    private String commitId;
    private long uploaderId;
    private String uploaderNickname;
    private LocalDateTime uploadedAt;
    private long repoId;
    private float fileSize;
    private FileState state;
    private Long prevId;
    private Boolean isLatest;

    public FileDTO() {
    }

    public FileDTO(String fileName, String filePath, String commitId, long repoId, float fileSize) {
        this.fileName = fileName;
        this.filePath = filePath;
        this.repoId = repoId;
        this.commitId = commitId;
        this.fileSize = fileSize;
    }

    public FileDTO(File file) {
        this.fileId = file.getFileId();
        this.fileName = file.getOriginalName();
        this.filePath = file.getFilePath();
        this.repoId = file.getRepoId();
        if(file.getCommit() != null) {
            this.commitId = file.getCommit().getCommitId();
            if(file.getCommit().getUser() != null) {
                this.uploaderId = file.getCommit().getUser().getId();
                this.uploaderNickname = file.getCommit().getUser().getNickname();
            }
            this.uploadedAt = file.getCommit().getCreatedAt();
        }
        this.fileSize = file.getSize();
        this.state = file.getState();
        this.prevId = file.getPrevId();
        this.isLatest = file.getIsLatest();
    }

    public void setCommit(Commit commit) {
        this.commitId = commit.getCommitId();
        if(commit.getUser() != null) {
            this.uploaderId = commit.getUser().getId();
            this.uploaderNickname = commit.getUser().getNickname();
        }
        this.uploadedAt = commit.getCreatedAt();
    }

    public Map<String, Object> toMap() {
        return Map.of(
          "fileId", fileId,
          "fileName", fileName,
          "fileSize", fileSize,
          "uploaderId", uploaderId,
          "uploaderNickname", uploaderNickname,
          "uploadedAt", uploadedAt,
                "state", state
        );
    }
}
