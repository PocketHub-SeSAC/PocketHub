package com.pockethub.commit.domain;

import com.pockethub.file.domain.File;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commit")
@Getter
public class Commit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long commitId;
    @Column(nullable = false)
    private String message;
    // auditing 사용하여 @CreatedDate 사용할 것인가 - 일단 디폴트값을 넣어줬음
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private long repoId;
    // TODO : userId 대신 User 엔티티로 변경
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "user_id", nullable = false)
    @Column(nullable = false)
    private long userId;
    @Column
    private long prId;

    @OneToMany(mappedBy = "commitId", cascade = CascadeType.PERSIST, orphanRemoval = true)
    private List<File> files = new ArrayList<>();

    protected Commit() {
    }

    public Commit(long repoId, long userId, String message) {
        this.repoId = repoId;
        this.userId = userId;
        this.message = message;
    }

    public void setPrId(long prId) {
        this.prId = prId;
    }
}