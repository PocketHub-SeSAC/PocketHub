package com.pockethub.file.domain;

import com.pockethub.commit.dto.FileState;
import com.pockethub.file.dto.FileDTO;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "file")
@Getter
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long fileId;
    @Column(nullable = false)
    private String filePath;
    @Column(nullable = false)
    private String originalName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FileState state;
    @Column(nullable = false)
    private Float size;
    @Setter
    @Column(nullable = false)
    private Boolean isLatest;
    @Column(nullable = false)
    private long repoId;
    @Column
    private String commitId;
    @Setter
    @Column
    private Long prevId;

    protected File() { }

    public File(String filePath, String originalName, FileState state, Float size, Boolean isLatest, long repoId, String commitId, Long prevId) {
        this.filePath = filePath;
        this.originalName = originalName;
        this.state = state;
        if(size != null)
            this.size = size;
        if(isLatest != null)
            this.isLatest = isLatest;
        this.repoId = repoId;
        this.commitId = commitId;
        if(prevId != null)
            this.prevId = prevId;
    }

    public File(FileDTO dto) {
        this.filePath = dto.getFilePath();
        this.originalName = dto.getOriginalName();
        this.state = dto.getState();
        this.size = dto.getSize();
        this.isLatest = dto.getIsLatest();
        this.repoId = dto.getRepoId();
        this.commitId = dto.getCommitId();
        this.prevId = dto.getPrevId();
    }
}
