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

    // Task 가 삭제돼 task_id 가 NULL 이 됐을 때 다시 연결하거나 다른 Task 로 바꾼다
    public void changeTask(long taskId) {
        this.taskId = taskId;
    }

    public void approve(long approverId) {
        decide(PrState.APPROVE, approverId, null);
    }

    public void reject(long approverId, String reason) {
        decide(PrState.DENIED, approverId, reason);
    }

    // 승인·거부 공통: 상태, 처리한 사람, 처리 시각, 거부 사유(승인이면 null)
    private void decide(PrState state, long approverId, String reply) {
        this.state = state;
        this.approverId = approverId;
        this.endAt = LocalDateTime.now();
        this.reply = reply;
    }
}
