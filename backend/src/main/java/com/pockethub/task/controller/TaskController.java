package com.pockethub.task.controller;

import com.pockethub.common.response.ResponseDTO;
import com.pockethub.task.domain.TaskStatus;
import com.pockethub.task.dto.TaskRequest;
import com.pockethub.task.dto.TaskResponse;
import com.pockethub.task.dto.TaskStatusRequest;
import com.pockethub.task.dto.TaskUpdateRequest;
import com.pockethub.task.service.TaskService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/tasks")
public class TaskController {
    private static final String TASKS_KEY = "tasks";
    private static final String CREATE_MESSAGE = "Task가 생성되었습니다.";
    private static final String FIND_LIST_MESSAGE = "Task 목록 조회에 성공했습니다.";
    private static final String FIND_MESSAGE = "Task 상세 조회에 성공했습니다.";
    private static final String UPDATE_MESSAGE = "Task가 수정되었습니다.";
    private static final String UPDATE_STATUS_MESSAGE = "Task 상태가 변경되었습니다.";
    private static final String DELETE_MESSAGE = "Task가 삭제되었습니다.";

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
                new ResponseDTO(HttpStatus.CREATED, task.toMap(), CREATE_MESSAGE)
        );
    }

    // API-023 Task 목록 조회 (status 가 없으면 전체)
    @GetMapping
    public ResponseEntity<ResponseDTO> findTasks(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @RequestParam(value = "status", required = false) TaskStatus status
    ) {
        List<Map<String, Object>> tasks = taskService.findTasks(currentUserId(authentication), repoId, status)
                .stream()
                .map(TaskResponse::toMap)
                .toList();
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, Map.of(TASKS_KEY, tasks), FIND_LIST_MESSAGE));
    }

    // API-024 Task 상세 조회
    @GetMapping("/{taskId}")
    public ResponseEntity<ResponseDTO> findTask(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("taskId") long taskId
    ) {
        TaskResponse task = taskService.findTask(currentUserId(authentication), repoId, taskId);
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, task.toMap(), FIND_MESSAGE));
    }

    // API-025 Task 수정
    @PatchMapping("/{taskId}")
    public ResponseEntity<ResponseDTO> updateTask(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("taskId") long taskId,
            @Valid @RequestBody TaskUpdateRequest request
    ) {
        TaskResponse task = taskService.updateTask(currentUserId(authentication), repoId, taskId, request);
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, task.toMap(), UPDATE_MESSAGE));
    }

    // API-026 Task 상태 변경 (응답은 taskId, status 만)
    @PatchMapping("/{taskId}/status")
    public ResponseEntity<ResponseDTO> updateTaskStatus(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("taskId") long taskId,
            @Valid @RequestBody TaskStatusRequest request
    ) {
        TaskResponse task = taskService.updateTaskStatus(currentUserId(authentication), repoId, taskId, request);
        return ResponseEntity.ok(new ResponseDTO(
                HttpStatus.OK, Map.of("taskId", task.getTaskId(), "status", task.getStatus()), UPDATE_STATUS_MESSAGE
        ));
    }

    // API-027 Task 삭제 (응답은 삭제한 taskId)
    @DeleteMapping("/{taskId}")
    public ResponseEntity<ResponseDTO> deleteTask(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("taskId") long taskId
    ) {
        taskService.deleteTask(currentUserId(authentication), repoId, taskId);
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, Map.of("taskId", taskId), DELETE_MESSAGE));
    }

    // TODO : JWT 필터로 바뀐 뒤에도 principal 이 userId 인지 확인
    private long currentUserId(Authentication authentication) {
        return Long.parseLong(authentication.getName());
    }
}