package com.pockethub.task.dto;

import com.pockethub.common.validation.ValidationRules;
import com.pockethub.task.domain.TaskPriority;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

// Task 생성·수정 요청 (managerId, priority, endAt 은 선택)
@Getter
@Setter
public class TaskRequest {
    @NotBlank(message = "Task 제목을 입력해주세요.")
    @Size(max = ValidationRules.TASK_TITLE_MAX, message = "제목은 " + ValidationRules.TASK_TITLE_MAX + "자 이하로 입력해주세요.")
    private String title;
    @NotBlank(message = "본문을 입력해주세요.")
    @Size(max = ValidationRules.TASK_TEXT_MAX, message = "본문은 " + ValidationRules.TASK_TEXT_MAX + "자 이하로 입력해주세요.")
    @JsonProperty("description")
    private String text;
    @JsonProperty("assigneeId")
    private Long managerId;
    private TaskPriority priority;
    @JsonProperty("dueDate")
    private LocalDate endAt;

    public TaskRequest() {
    }
}
