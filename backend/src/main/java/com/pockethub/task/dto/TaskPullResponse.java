package com.pockethub.task.dto;

import com.pockethub.pr.domain.Pr;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.Getter;

@Getter
public class TaskPullResponse {

    private final Long prId;
    private final String title;
    private final String status;
    private final Long authorId;
    private final Long approverId;

    public TaskPullResponse(Pr pr) {
        this.prId = pr.getPrId();
        this.title = pr.getTitle();
        // OPEN / APPROVE / DENIED
        this.status = pr.getState().name();
        this.authorId = pr.getUserId();
        // 지정 리뷰어는 없고, 승인·거부한 사람(approver_id)을 준다. 결정 전에는 null
        this.approverId = pr.getApproverId();
    }

    // approverId 가 null 일 수 있어서 Map.of 대신 LinkedHashMap 을 쓴다 (명세 순서 유지)
    public Map<String, Object> toMap() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("prId", prId);
        map.put("title", title);
        map.put("status", status);
        map.put("authorId", authorId);
        map.put("approverId", approverId);
        return map;
    }
}