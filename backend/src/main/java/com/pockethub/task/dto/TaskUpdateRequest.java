package com.pockethub.task.dto;

import com.pockethub.common.validation.ValidationRules;
import com.pockethub.task.domain.TaskPriority;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

// Task 수정 요청 (전부 선택, 보낸 필드만 수정)
@Getter
@Setter
public class TaskUpdateRequest {
    @Pattern(regexp = "(?s).*\\S.*", message = "제목은 공백일 수 없습니다.")
    @Size(max = ValidationRules.TASK_TITLE_MAX, message = "제목은 " + ValidationRules.TASK_TITLE_MAX + "자 이하로 입력해주세요.")
    private String title;
    @Pattern(regexp = "(?s).*\\S.*", message = "본문은 공백일 수 없습니다.")
    @Size(max = ValidationRules.TASK_TEXT_MAX, message = "본문은 " + ValidationRules.TASK_TEXT_MAX + "자 이하로 입력해주세요.")
    private String text;
    private Long managerId;
    private TaskPriority priority;
    private LocalDate endAt;

    public TaskUpdateRequest() {
    }
}