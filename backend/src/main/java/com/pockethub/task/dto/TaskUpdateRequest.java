package com.pockethub.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pockethub.common.validation.ValidationRules;
import com.pockethub.task.domain.TaskPriority;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

// Task 수정 요청 (전부 선택, 보낸 필드만 수정)
@Getter
@Setter
public class TaskUpdateRequest {
    @Pattern(regexp = "(?s).*\\S.*", message = "Task 제목을 입력해주세요.")
    @Size(max = ValidationRules.TASK_TITLE_MAX, message = "제목은 " + ValidationRules.TASK_TITLE_MAX + "자 이하로 입력해주세요.")
    private String title;
    @Size(max = ValidationRules.TASK_TEXT_MAX, message = "본문은 " + ValidationRules.TASK_TEXT_MAX + "자 이하로 입력해주세요.")
    @JsonProperty("description")
    private String text;
    @JsonProperty("assigneeId")
    private Long managerId;
    // managerId 가 요청에 들어왔는지 (null 로 보내 해제하는 경우와 안 보낸 경우를 구분)
    @Setter(AccessLevel.NONE)
    private boolean managerIdSpecified;
    private TaskPriority priority;
    @JsonProperty("dueDate")
    private LocalDate endAt;

    public TaskUpdateRequest() {
    }

    public void setManagerId(Long managerId) {
        this.managerId = managerId;
        this.managerIdSpecified = true;
    }
}