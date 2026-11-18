package com.pockethub.pr.dto;

import lombok.Getter;
import lombok.Setter;

// PR 의 연결 Task 변경: 연결된 Task 가 삭제됐을 때 다시 연결하거나 다른 Task 로 바꾼다
@Setter
@Getter
public class PrTaskRequest {
    private Long taskId;
}
