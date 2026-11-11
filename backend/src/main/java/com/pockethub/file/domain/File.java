package com.pockethub.file.domain;

import jakarta.persistence.*;
import lombok.Getter;

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
    @Column(nullable = false)
    private String savedName;
    // TODO : enum 으로 변경
    @Column(nullable = false)
    private String state;
    @Column(nullable = false)
    private Float size;
    @Column(nullable = false)
    private Boolean isLatest;
    @Column(nullable = false)
    private long repoId;
    @Column(nullable = false)
    private long commitId;
    @Column
    private Long prevId;

    protected File() { }

    public File(String filePath, String originalName, String savedName, String state, Float size, Boolean isLatest, long repoId, long commitId, Long prevId) {
        this.filePath = filePath;
        this.originalName = originalName;
        this.savedName = savedName;
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
}
