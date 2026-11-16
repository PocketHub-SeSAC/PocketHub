package com.pockethub.pr.dto;

import com.pockethub.commit.domain.Commit;
import com.pockethub.file.domain.File;
import com.pockethub.pr.domain.Pr;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// PR 상세 (프론트 목업 pullDetail 모양): 목록 정보 + 설명 + 커밋 + 파일
@Getter
public class PrDetailResponse extends PrSummaryResponse {
    private final String description;   // DB pr.text
    private final List<CommitItem> commits;
    private final List<FileItem> files;

    public PrDetailResponse(Pr pr, PrMemberResponse author, PrTaskResponse task, long reviewCount,
                            PrMemberResponse decidedBy, List<Commit> commits, List<File> files) {
        super(pr, author, task, reviewCount, decidedBy);
        this.description = pr.getText();

        Map<String, Long> fileCounts = files.stream()
                .collect(Collectors.groupingBy(f -> f.getCommit().getCommitId(), Collectors.counting()));
        this.commits = commits.stream()
                .map(commit -> CommitItem.of(commit, fileCounts.getOrDefault(commit.getCommitId(), 0L)))
                .toList();
        this.files = files.stream().map(FileItem::of).toList();
    }

    public record CommitItem(String commitId, String commitMessage, Long userId,
                             LocalDateTime createdAt, long fileCount) {
        static CommitItem of(Commit commit, long fileCount) {
            return new CommitItem(commit.getCommitId(), commit.getMessage(), commit.getUser().getId(),
                    commit.getCreatedAt(), fileCount);
        }
    }

    // action: ADD·UPDATE·DELETE (DB file.state)
    public record FileItem(Long fileId, String commitId, String name, Float size, String action) {
        static FileItem of(File file) {
            return new FileItem(file.getFileId(), file.getCommit().getCommitId(), file.getOriginalName(),
                    file.getSize(), file.getState().name());
        }
    }
}
