package com.pockethub.file.domain;

import com.pockethub.commit.domain.Commit;
import com.pockethub.file.dto.FileState;
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "commit_id", nullable = false, updatable = false)
    private Commit commit;
    @Setter
    @Column
    private Long prevId;

    protected File() { }

    public File(String filePath, String originalName, FileState state, Float size, Boolean isLatest, long repoId, Commit commit, Long prevId) {
        this.filePath = filePath;
        this.originalName = originalName;
        this.state = state;
        if(size != null)
            this.size = size;
        if(isLatest != null)
            this.isLatest = isLatest;
        this.repoId = repoId;
        this.commit = commit;
        if(prevId != null)
            this.prevId = prevId;
    }

    public File(FileDTO dto, Commit commit) {
        this.filePath = dto.getFilePath();
        this.originalName = dto.getFileName();
        this.state = dto.getState();
        this.size = dto.getFileSize();
        this.isLatest = dto.getIsLatest();
        this.repoId = dto.getRepoId();
        this.prevId = dto.getPrevId();
        this.commit = commit;
    }
}
