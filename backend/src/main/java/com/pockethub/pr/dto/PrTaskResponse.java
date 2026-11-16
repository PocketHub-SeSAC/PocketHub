package com.pockethub.pr.dto;

import com.pockethub.pr.repository.PrRepository.TaskRow;

// PR 에 연결된 Task 표시용 (프론트 목업 taskRef 모양)
// TODO : Task 엔티티·TaskResponse 가 머지되면 교체
public record PrTaskResponse(Long taskId, String title, String status) {

    public static PrTaskResponse from(TaskRow row) {
        return new PrTaskResponse(row.getTaskId(), row.getTitle(), row.getStatus());
    }
}
