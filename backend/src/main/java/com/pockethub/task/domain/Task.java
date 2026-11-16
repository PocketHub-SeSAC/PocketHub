package com.pockethub.task.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "task")
@Getter
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;
    @Column(nullable = false)
    private String title;
    @Column(nullable = false)
    private String text;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority;
    // 담당자(user.user_id), 미지정이면 null
    @Column
    private Long managerId;
    // 팀(repository.repo_id)
    @Column(nullable = false)
    private Long repoId;
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column
    private LocalDateTime endAt;

    protected Task() {
    }

    public Task(Long repoId, String title, String text, TaskPriority priority, Long managerId, LocalDateTime endAt) {
        this.repoId = repoId;
        this.title = title;
        this.text = text;
        this.priority = priority;
        this.managerId = managerId;
        this.endAt = endAt;
        this.status = TaskStatus.TODO;
    }
}
