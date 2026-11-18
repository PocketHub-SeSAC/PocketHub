package com.pockethub.task.dto;

import com.pockethub.task.domain.Task;
import com.pockethub.task.domain.TaskPriority;
import com.pockethub.task.domain.TaskStatus;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Getter;

@Getter
public class TaskResponse {
    private final Long taskId;
    private final String title;
    private final String description;
    private final TaskStatus status;
    private final Long assigneeId;
    // TODO: task 테이블에 start_date 컬럼이 생기기 전까지는 항상 null
    // 시작일은 입력받지 않고 Task 생성일로 정한다
    private final LocalDate startDate;
    private final LocalDate dueDate;
    private final TaskPriority priority;

    private TaskResponse(Task task) {
        this.taskId = task.getTaskId();
        this.title = task.getTitle();
        this.description = task.getText();
        this.status = task.getStatus();
        this.assigneeId = task.getManagerId();
        this.startDate = task.getCreatedAt() != null ? task.getCreatedAt().toLocalDate() : null;
        this.dueDate = task.getEndAt() != null ? task.getEndAt().toLocalDate() : null;
        this.priority = task.getPriority();
    }

    public static TaskResponse from(Task task) {
        return new TaskResponse(task);
    }

    // ResponseDTO 의 data 가 Map 이라서, 명세서처럼 필드를 data 바로 아래에 넣으려고 Map 으로 바꾼다
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("taskId", taskId);
        map.put("title", title);
        map.put("description", description);
        map.put("status", status);
        map.put("assigneeId", assigneeId);
        map.put("startDate", startDate);
        map.put("dueDate", dueDate);
        map.put("priority", priority);
        return map;
    }
}