package com.pockethub.pr.dto;

import com.pockethub.pr.domain.Pr;
import lombok.Getter;

import java.time.LocalDateTime;

// PR 목록 한 줄 (프론트 목업 pullSummary 모양)
@Getter
public class PrSummaryResponse {
    private final Long prId;
    private final String title;
    private final String status;                // OPEN, APPROVE, DENIED
    private final long repoId;
    private final PrMemberResponse author;      // 작성자
    private final PrTaskResponse task;          // 연결 Task (삭제됐으면 null)
    private final long reviewCount;
    private final LocalDateTime createdAt;
    private final LocalDateTime decidedAt;      // 승인·거부 시각 (DB end_at)
    private final PrMemberResponse decidedBy;   // 승인·거부한 사람 (DB approver_id)
    private final String reply;                 // 거부 사유

    public PrSummaryResponse(Pr pr, PrMemberResponse author, PrTaskResponse task,
                             long reviewCount, PrMemberResponse decidedBy) {
        this.prId = pr.getPrId();
        this.title = pr.getTitle();
        this.status = pr.getState().name();
        this.repoId = pr.getRepoId();
        this.author = author;
        this.task = task;
        this.reviewCount = reviewCount;
        this.createdAt = pr.getCreatedAt();
        this.decidedAt = pr.getEndAt();
        this.decidedBy = decidedBy;
        this.reply = pr.getReply();
    }
}
