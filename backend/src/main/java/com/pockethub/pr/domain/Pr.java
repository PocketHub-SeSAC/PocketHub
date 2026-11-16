package com.pockethub.pr.domain;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "pr")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Pr {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long prId;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String text;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrState state;
    @Column(nullable = false)
    private long repoId;
    // TODO : Task 엔티티가 생기면 연관관계로 변경
    @Column
    private Long taskId;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column
    private LocalDateTime endAt;
    @Column
    private Long approverId;
    // TODO : userId 대신 User 엔티티로 변경
    @Column(nullable = false)
    private long userId;
    @Column
    private String reply;

    protected Pr() {
    }

    public Pr(String title, String text, long repoId, Long taskId, long userId) {
        this.title = title;
        this.text = text;
        this.repoId = repoId;
        this.taskId = taskId;
        this.userId = userId;
        this.state = PrState.OPEN;
    }

    public boolean isOpen() {
        return state == PrState.OPEN;
    }

    public boolean isWrittenBy(long userId) {
        return this.userId == userId;
    }

    public void update(String title, String text) {
        this.title = title;
        this.text = text;
    }
}
