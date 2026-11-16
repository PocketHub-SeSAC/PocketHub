package com.pockethub.task.dto;

import com.pockethub.task.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Task 상태 변경 요청
@Getter
@Setter
public class TaskStatusRequest {
    @NotNull(message = "변경할 상태를 입력해주세요.")
    private TaskStatus status;

    public TaskStatusRequest() {
    }
}