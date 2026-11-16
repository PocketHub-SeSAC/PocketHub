package com.pockethub.task.controller;

import com.pockethub.common.response.ResponseDTO;
import com.pockethub.task.dto.TaskRequest;
import com.pockethub.task.dto.TaskResponse;
import com.pockethub.task.service.TaskService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/tasks")
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // API-022 Task 생성
    @PostMapping
    public ResponseEntity<ResponseDTO> createTask(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @Valid @RequestBody TaskRequest request
    ) {
        TaskResponse task = taskService.createTask(currentUserId(authentication), repoId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ResponseDTO(HttpStatus.CREATED, Map.of("task", task), "Task가 생성되었습니다.")
        );
    }

    // TODO : JWT 필터로 바뀐 뒤에도 principal 이 userId 인지 확인
    private long currentUserId(Authentication authentication) {
        return Long.parseLong(authentication.getName());
    }
}
