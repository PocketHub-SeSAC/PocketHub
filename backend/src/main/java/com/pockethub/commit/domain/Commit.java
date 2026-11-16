package com.pockethub.commit.domain;

import com.pockethub.file.domain.File;
import com.pockethub.user.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "commit")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Commit {
    @Id
    private String commitId;
    @Column(nullable = false)
    private String message;
    @CreatedDate
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private long repoId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Setter
    @Column
    private Long prId;

    @OneToMany(mappedBy = "commitId", cascade = CascadeType.PERSIST, orphanRemoval = true)
    private List<File> files = new ArrayList<>();

    protected Commit() {
    }

    public Commit(String commitId, long repoId, User user, String message) {
        this.commitId = commitId;
        this.repoId = repoId;
        this.user = user;
        this.message = message;
    }
}