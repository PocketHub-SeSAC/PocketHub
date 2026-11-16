package com.pockethub.task.service;

import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.task.domain.Task;
import com.pockethub.task.domain.TaskPriority;
import com.pockethub.task.domain.TaskStatus;
import com.pockethub.task.dto.TaskRequest;
import com.pockethub.task.dto.TaskResponse;
import com.pockethub.task.dto.TaskStatusRequest;
import com.pockethub.task.repository.TaskRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pockethub.task.dto.TaskUpdateRequest;

@Service
public class TaskService {
    private static final TaskPriority DEFAULT_PRIORITY = TaskPriority.MEDIUM;

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional
    public TaskResponse createTask(long userId, long repoId, TaskRequest request) {
        validateMember(userId, repoId);
        validateManager(request.getManagerId(), repoId);
        // 작업일 = 생성일
        validateEndAt(request.getEndAt(), LocalDate.now());

        TaskPriority priority = request.getPriority() != null ? request.getPriority() : DEFAULT_PRIORITY;
        Task task = taskRepository.save(new Task(
                repoId, request.getTitle(), request.getText(), priority, request.getManagerId(), toDateTime(request.getEndAt())
        ));
        return TaskResponse.from(task);
    }

    // status 가 없으면 전체, 최신 Task 가 먼저 오게 정렬
    @Transactional(readOnly = true)
    public List<TaskResponse> findTasks(long userId, long repoId, TaskStatus status) {
        validateMember(userId, repoId);

        List<Task> tasks = status == null
                ? taskRepository.findByRepoIdOrderByTaskIdDesc(repoId)
                : taskRepository.findByRepoIdAndStatusOrderByTaskIdDesc(repoId, status);
        return tasks.stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse findTask(long userId, long repoId, long taskId) {
        validateMember(userId, repoId);

        Task task = taskRepository.findByTaskIdAndRepoId(taskId, repoId)
                .orElseThrow(() -> new NotFoundException("Task를 찾을 수 없습니다."));
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTask(long userId, long repoId, long taskId, TaskUpdateRequest request) {
        validateMember(userId, repoId);

        Task task = taskRepository.findByTaskIdAndRepoId(taskId, repoId)
                .orElseThrow(() -> new NotFoundException("Task를 찾을 수 없습니다."));

        validateManager(request.getManagerId(), repoId);
        // 작업일 = 생성일
        validateEndAt(request.getEndAt(), task.getCreatedAt().toLocalDate());

        task.update(
                request.getTitle(), request.getText(), request.getPriority(),
                request.getManagerId(), toDateTime(request.getEndAt())
        );
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateTaskStatus(long userId, long repoId, long taskId, TaskStatusRequest request) {
        validateMember(userId, repoId);

        Task task = taskRepository.findByTaskIdAndRepoId(taskId, repoId)
                .orElseThrow(() -> new NotFoundException("Task를 찾을 수 없습니다."));

        task.changeStatus(request.getStatus());
        return TaskResponse.from(task);
    }

    // 팀이 없으면 404, 요청한 사용자가 팀원이 아니면 403
    private void validateMember(long userId, long repoId) {
        if (taskRepository.countTeam(repoId) == 0) {
            throw new NotFoundException("팀을 찾을 수 없습니다.");
        }
        if (taskRepository.countMember(repoId, userId) == 0) {
            throw new ForbiddenException("팀원만 접근할 수 있습니다.");
        }
    }

    private void validateManager(Long managerId, long repoId) {
        if (managerId != null && taskRepository.countMember(repoId, managerId) == 0) {
            throw new IllegalArgumentException("담당자는 팀원 중에서 지정해야 합니다.");
        }
    }

    private void validateEndAt(LocalDate endAt, LocalDate workDate) {
        if (endAt != null && endAt.isBefore(workDate)) {
            throw new IllegalArgumentException("마감일은 작업일보다 빠를 수 없습니다.");
        }
    }

    // 마감일은 날짜만 받으므로 그날 0시로 저장한다
    private LocalDateTime toDateTime(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }
}
