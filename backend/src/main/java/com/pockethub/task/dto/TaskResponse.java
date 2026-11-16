package com.pockethub.task.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pockethub.task.domain.Task;
import com.pockethub.task.domain.TaskPriority;
import com.pockethub.task.domain.TaskStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class TaskResponse {
    private final Long taskId;
    private final Long repoId;
    private final String title;
    private final String text;
    private final TaskStatus status;
    private final TaskPriority priority;
    private final Long managerId;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime createdAt;
    private final LocalDate endAt;

    private TaskResponse(Task task) {
        this.taskId = task.getTaskId();
        this.repoId = task.getRepoId();
        this.title = task.getTitle();
        this.text = task.getText();
        this.status = task.getStatus();
        this.priority = task.getPriority();
        this.managerId = task.getManagerId();
        this.createdAt = task.getCreatedAt();
        this.endAt = task.getEndAt() != null ? task.getEndAt().toLocalDate() : null;
    }

    public static TaskResponse from(Task task) {
        return new TaskResponse(task);
    }
}
