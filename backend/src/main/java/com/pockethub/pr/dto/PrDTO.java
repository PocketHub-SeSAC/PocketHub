package com.pockethub.pr.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.pr.domain.Pr;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PrDTO {
    private final Long prId;
    private final String title;
    private final String description;
    private final String status;    // OPEN, APPROVE, DENIED
    private final long repoId;
    private final Long taskId;
    private final Long userId;      // TODO : UserDTO 객체로 바뀜
    private final LocalDateTime createdAt;
    private final LocalDateTime endAt;      // 승인·거부 시각
    private final Long approverId;          // 승인·거부한 사람
    private final String reply;             // 거부 사유
    private final List<CommitDTO> commits;  // 목록 조회에서는 빠짐(null)

    // 목록용: 커밋 없이
    public PrDTO(Pr pr) {
        this(pr, null);
    }

    // 상세·생성·수정용: 커밋 포함
    public PrDTO(Pr pr, List<Commit> commits) {
        this.prId = pr.getPrId();
        this.title = pr.getTitle();
        this.description = pr.getText();
        this.status = pr.getState().name();
        this.repoId = pr.getRepoId();
        this.taskId = pr.getTaskId();
        this.userId = pr.getUserId();
        this.createdAt = pr.getCreatedAt();
        this.endAt = pr.getEndAt();
        this.approverId = pr.getApproverId();
        this.reply = pr.getReply();
        this.commits = (commits == null) ? null : commits.stream()
                .map(PrDTO::toCommitDTO)
                .toList();
    }

    private static CommitDTO toCommitDTO(Commit commit) {
        CommitDTO commitDTO = new CommitDTO(commit.getCommitId(), commit.getMessage());
        commitDTO.setUserId(commit.getUserId());
        return commitDTO;
    }
}
