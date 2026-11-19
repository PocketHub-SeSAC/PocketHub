package com.pockethub.pr.service;

import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.common.validation.ValidationRules;
import com.pockethub.file.domain.File;
import com.pockethub.file.service.FileService;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import com.pockethub.pr.dto.*;
import com.pockethub.pr.repository.PrRepository;
import com.pockethub.pr.repository.PrRepository.MemberRow;
import com.pockethub.pr.repository.PrRepository.ReviewCountRow;
import com.pockethub.pr.repository.PrRepository.TaskRow;
import com.pockethub.task.domain.TaskStatus;
import com.pockethub.task.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PrService {
    // 거부 사유는 DB pr.reply VARCHAR(4000)
    private static final int REPLY_MAX = 4000;

    private final PrRepository prRepository;
    private final CommitRepository commitRepository;
    private final TaskRepository taskRepository;

    private final FileService fileService;

    public PrService(PrRepository prRepository, CommitRepository commitRepository, TaskRepository taskRepository, FileService fileService) {
        this.prRepository = prRepository;
        this.commitRepository = commitRepository;
        this.taskRepository = taskRepository;
        this.fileService = fileService;
    }

    @Transactional
    public PrDetailResponse createPr(long userId, long repoId, PrCreateRequest request) {
        validateMember(userId, repoId);
        String title = validateTitle(request.getTitle());
        String text = validateText(request.getDescription());
        List<String> commitIds = validateCommitIds(request.getCommitIds());
        if (request.getTaskId() == null) {
            throw new IllegalArgumentException("연결할 Task를 골라 주세요.");
        }
        validateTask(repoId, request.getTaskId());

        List<Commit> commits = findCommitsForPr(userId, repoId, commitIds);

        Pr pr = prRepository.save(new Pr(title, text, repoId, request.getTaskId(), userId));
        commits.forEach(commit -> commit.setPrId(pr.getPrId()));

        return toDetail(pr, commits);
    }

    @Transactional(readOnly = true)
    public List<PrSummaryResponse> getPrs(long userId, long repoId, String status) {
        validateMember(userId, repoId);
        PrState state = PrState.from(status);
        List<Pr> prs = (state == null)
                ? prRepository.findByRepoIdOrderByPrIdDesc(repoId)
                : prRepository.findByRepoIdAndStateOrderByPrIdDesc(repoId, state);

        Related related = loadRelated(prs);
        return prs.stream().map(related::summary).toList();
    }

    @Transactional(readOnly = true)
    public PrDetailResponse getPr(long userId, long repoId, long prId) {
        validateMember(userId, repoId);
        Pr pr = findPr(repoId, prId);
        return toDetail(pr, prRepository.findCommitsByPrId(prId));
    }

    @Transactional
    public PrDetailResponse updatePr(long userId, long repoId, long prId, PrUpdateRequest request) {
        Pr pr = findEditablePr(userId, repoId, prId, "수정");
        pr.update(validateTitle(request.getTitle()), validateText(request.getDescription()));
        return toDetail(pr, prRepository.findCommitsByPrId(prId));
    }

    // 연결 Task 변경: Task 가 삭제돼 연결이 끊긴 PR 을 다시 연결하거나 다른 Task 로 바꾼다
    // 수정과 같은 조건(작성자 본인 + OPEN), 같은 팀 Task 만
    @Transactional
    public PrDetailResponse changeTask(long userId, long repoId, long prId, PrTaskRequest request) {
        Pr pr = findEditablePr(userId, repoId, prId, "수정");
        if (request.getTaskId() == null) {
            throw new IllegalArgumentException("연결할 Task를 골라 주세요.");
        }
        validateTask(repoId, request.getTaskId());
        pr.changeTask(request.getTaskId());
        return toDetail(pr, prRepository.findCommitsByPrId(prId));
    }

    // 커밋은 FK(ON DELETE SET NULL)로도 풀리지만, 같은 트랜잭션 안의 커밋 엔티티 값도 맞추려고 직접 비운다
    // 리뷰는 FK(ON DELETE CASCADE)로 함께 삭제됨
    @Transactional
    public void deletePr(long userId, long repoId, long prId) {
        Pr pr = findEditablePr(userId, repoId, prId, "삭제");
        prRepository.findCommitsByPrId(prId).forEach(commit -> commit.setPrId(null));
        prRepository.delete(pr);
    }

    // API-032 승인: 연결된 Task 를 같은 트랜잭션에서 DONE 으로 바꾼다 (둘 중 하나만 바뀌는 일이 없게)
    @Transactional
    public PrDetailResponse approvePr(long userId, long repoId, long prId) {
        Pr pr = findDecidablePr(userId, repoId, prId, "승인");
        pr.approve(userId);
        // Task 가 지워졌으면(task_id NULL) PR 만 승인
        if (pr.getTaskId() != null) {
            taskRepository.findById(pr.getTaskId()).ifPresent(task -> task.changeStatus(TaskStatus.DONE));
        }
        return toDetail(pr, prRepository.findCommitsByPrId(prId));
    }

    // API-033 거부: 사유는 pr.reply 에 저장, Task 상태와 커밋은 그대로 둔다
    @Transactional
    public PrDetailResponse rejectPr(long userId, long repoId, long prId, PrRejectRequest request) {
        Pr pr = findDecidablePr(userId, repoId, prId, "거부");
        pr.reject(userId, validateReason(request.getReason()));
        List<Commit> commits = prRepository.findCommitsByPrId(prId);
        StringBuilder sb = fileService.revertLatestFile(commits.stream().map(Commit::getCommitId).toList());
        return toDetail(pr, prRepository.findCommitsByPrId(prId));
    }

    // 팀이 없으면 404, 팀원(소유자 포함)이 아니면 403 — Task 기능과 같은 기준·메시지
    // TODO : 팀(Repo·Collaborator) 리포지토리가 dev 에 들어오면 그쪽 조회로 교체
    private void validateMember(long userId, long repoId) {
        if (taskRepository.countTeam(repoId) == 0) {
            throw new NotFoundException("팀을 찾을 수 없습니다.");
        }
        if (taskRepository.countMember(repoId, userId) == 0) {
            throw new ForbiddenException("팀원만 접근할 수 있습니다.");
        }
    }

    // 승인·거부 공통 검사: 팀원(403) → 존재(404) → 리뷰 대기 상태(409) → 작성자 본인이 아닌지(403)
    private Pr findDecidablePr(long userId, long repoId, long prId, String action) {
        validateMember(userId, repoId);
        Pr pr = findPr(repoId, prId);
        if (!pr.isOpen()) {
            throw new ConflictException("이미 처리된 PR입니다.");
        }
        if (pr.isWrittenBy(userId)) {
            throw new ForbiddenException("본인이 작성한 PR은 " + action + "할 수 없습니다.");
        }
        return pr;
    }

    // 다른 팀 Task 도 존재 여부를 드러내지 않도록 없는 Task 와 같은 404
    private void validateTask(long repoId, long taskId) {
        boolean sameTeam = taskRepository.findById(taskId)
                .map(task -> task.getRepoId() == repoId)
                .orElse(false);
        if (!sameTeam) {
            throw new NotFoundException("Task를 찾을 수 없습니다.");
        }
    }

    // 다른 팀 PR 은 존재 여부를 드러내지 않도록 없는 PR 과 같은 404
    private Pr findPr(long repoId, long prId) {
        return prRepository.findByPrIdAndRepoId(prId, repoId)
                .orElseThrow(() -> new NotFoundException("PR을 찾을 수 없습니다."));
    }

    // 수정·삭제 공통 검사: 팀원(403) → 존재(404) → 리뷰 대기 상태(409) → 작성자 본인(403)
    private Pr findEditablePr(long userId, long repoId, long prId, String action) {
        validateMember(userId, repoId);
        Pr pr = findPr(repoId, prId);
        if (!pr.isOpen()) {
            throw new ConflictException("이미 처리된 PR은 " + action + "할 수 없어요.");
        }
        if (!pr.isWrittenBy(userId)) {
            throw new ForbiddenException("내가 작성한 PR만 " + action + "할 수 있어요.");
        }
        return pr;
    }

    // ---------- 응답 조립 ----------

    private PrDetailResponse toDetail(Pr pr, List<Commit> commits) {
        List<String> commitIds = commits.stream().map(Commit::getCommitId).toList();
        List<File> files = commitIds.isEmpty() ? List.of() : prRepository.findFilesByCommitIds(commitIds);
        return loadRelated(List.of(pr)).detail(pr, commits, files);
    }

    // 작성자·승인자·Task·리뷰 수를 PR 개수와 상관없이 한 번씩만 조회 (목록 N+1 방지)
    private Related loadRelated(List<Pr> prs) {
        Set<Long> userIds = new HashSet<>();
        Set<Long> taskIds = new HashSet<>();
        Set<Long> prIds = new HashSet<>();
        for (Pr pr : prs) {
            userIds.add(pr.getUserId());
            if (pr.getApproverId() != null) userIds.add(pr.getApproverId());
            if (pr.getTaskId() != null) taskIds.add(pr.getTaskId());
            prIds.add(pr.getPrId());
        }

        Map<Long, MemberRow> members = toMap(userIds, prRepository::findMembers, MemberRow::getUserId);
        Map<Long, TaskRow> tasks = toMap(taskIds, prRepository::findTasks, TaskRow::getTaskId);
        Map<Long, Long> reviewCounts = prIds.isEmpty() ? Map.of() : prRepository.countReviews(prIds).stream()
                .collect(Collectors.toMap(ReviewCountRow::getPrId, ReviewCountRow::getReviewCount));
        return new Related(members, tasks, reviewCounts);
    }

    // IN () 빈 목록은 SQL 오류라 조회하지 않는다
    private static <T> Map<Long, T> toMap(Collection<Long> ids, Function<Collection<Long>, List<T>> finder,
                                          Function<T, Long> idOf) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return finder.apply(ids).stream().collect(Collectors.toMap(idOf, Function.identity()));
    }

    private record Related(Map<Long, MemberRow> members, Map<Long, TaskRow> tasks, Map<Long, Long> reviewCounts) {

        PrSummaryResponse summary(Pr pr) {
            return new PrSummaryResponse(pr, member(pr.getUserId()), task(pr), reviewCount(pr), member(pr.getApproverId()));
        }

        PrDetailResponse detail(Pr pr, List<Commit> commits, List<File> files) {
            return new PrDetailResponse(pr, member(pr.getUserId()), task(pr), reviewCount(pr),
                    member(pr.getApproverId()), commits, files);
        }

        private PrMemberResponse member(Long userId) {
            if (userId == null) {
                return null;
            }
            MemberRow row = members.get(userId);
            return (row == null) ? PrMemberResponse.idOnly(userId) : PrMemberResponse.from(row);
        }

        // Task 가 삭제됐으면(task_id NULL) null
        private PrTaskResponse task(Pr pr) {
            TaskRow row = (pr.getTaskId() == null) ? null : tasks.get(pr.getTaskId());
            return (row == null) ? null : PrTaskResponse.from(row);
        }

        private long reviewCount(Pr pr) {
            return reviewCounts.getOrDefault(pr.getPrId(), 0L);
        }
    }

    // ---------- 입력 검증 ----------

    private String validateTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("PR 제목을 입력해 주세요.");
        }
        String trimmed = title.trim();
        if (trimmed.length() > ValidationRules.PR_TITLE_MAX) {
            throw new IllegalArgumentException("PR 제목은 " + ValidationRules.PR_TITLE_MAX + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }

    // 설명은 선택 입력이지만 pr.text 컬럼이 NOT NULL 이라 빈 문자열로 저장
    private String validateText(String description) {
        String trimmed = (description == null) ? "" : description.trim();
        if (trimmed.length() > ValidationRules.PR_TEXT_MAX) {
            throw new IllegalArgumentException("PR 설명은 " + ValidationRules.PR_TEXT_MAX + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }

    private String validateReason(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("거부 사유를 입력해 주세요.");
        }
        String trimmed = reason.trim();
        if (trimmed.length() > REPLY_MAX) {
            throw new IllegalArgumentException("거부 사유는 " + REPLY_MAX + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }

    private List<String> validateCommitIds(List<String> commitIds) {
        List<String> distinctIds = (commitIds == null) ? List.of() : commitIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (distinctIds.isEmpty()) {
            throw new IllegalArgumentException("포함할 커밋을 1개 이상 골라 주세요.");
        }
        return distinctIds;
    }

    private List<Commit> findCommitsForPr(long userId, long repoId, List<String> commitIds) {
        List<Commit> commits = commitRepository.findAllById(commitIds);

        // 다른 팀 커밋은 존재 여부를 드러내지 않도록 없는 커밋과 같은 메시지로 처리
        boolean hasMissing = commits.size() != commitIds.size()
                || commits.stream().anyMatch(commit -> commit.getRepoId() != repoId);
        if (hasMissing) {
            throw new IllegalArgumentException("고른 커밋 중에 찾을 수 없는 커밋이 있어요. 목록을 새로고침해 주세요.");
        }

        for (Commit commit : commits) {
            if (commit.getUser().getId() != userId) {
                throw new IllegalArgumentException("내가 만든 커밋만 PR에 넣을 수 있어요.");
            }
            if (commit.getPrId() != null) {
                throw new IllegalArgumentException("커밋 \"" + commit.getMessage() + "\"은 이미 다른 PR에 연결돼 있어요.");
            }
        }
        return commits;
    }
}
