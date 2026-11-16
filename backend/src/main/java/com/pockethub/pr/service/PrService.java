package com.pockethub.pr.service;

import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.common.validation.ValidationRules;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import com.pockethub.pr.dto.PrCreateRequest;
import com.pockethub.pr.dto.PrDTO;
import com.pockethub.pr.dto.PrUpdateRequest;
import com.pockethub.pr.repository.PrRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class PrService {
    private final PrRepository prRepository;
    private final CommitRepository commitRepository;

    public PrService(PrRepository prRepository, CommitRepository commitRepository) {
        this.prRepository = prRepository;
        this.commitRepository = commitRepository;
    }

    // TODO : 팀원 여부 확인, Task 존재·소속 확인은 member·task 기능이 생기면 추가
    @Transactional
    public PrDTO createPr(long userId, long repoId, PrCreateRequest request) {
        String title = validateTitle(request.getTitle());
        String text = validateText(request.getDescription());
        List<String> commitIds = validateCommitIds(request.getCommitIds());
        if (request.getTaskId() == null) {
            throw new IllegalArgumentException("연결할 Task를 골라 주세요.");
        }

        List<Commit> commits = findCommitsForPr(userId, repoId, commitIds);

        Pr pr = prRepository.save(new Pr(title, text, repoId, request.getTaskId(), userId));
        commits.forEach(commit -> commit.setPrId(pr.getPrId()));

        return new PrDTO(pr, commits);
    }

    // TODO : 팀원 여부 확인(403)은 member·team 기능이 생기면 추가 (조회·수정·삭제 공통)
    @Transactional(readOnly = true)
    public List<PrDTO> getPrs(long repoId, String status) {
        PrState state = PrState.from(status);
        List<Pr> prs = (state == null)
                ? prRepository.findByRepoIdOrderByPrIdDesc(repoId)
                : prRepository.findByRepoIdAndStateOrderByPrIdDesc(repoId, state);
        return prs.stream().map(PrDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public PrDTO getPr(long repoId, long prId) {
        Pr pr = findPr(repoId, prId);
        return new PrDTO(pr, prRepository.findCommitsByPrId(prId));
    }

    @Transactional
    public PrDTO updatePr(long userId, long repoId, long prId, PrUpdateRequest request) {
        Pr pr = findEditablePr(userId, repoId, prId, "수정");
        pr.update(validateTitle(request.getTitle()), validateText(request.getDescription()));
        return new PrDTO(pr, prRepository.findCommitsByPrId(prId));
    }

    // 커밋은 FK(ON DELETE SET NULL)로도 풀리지만, 같은 트랜잭션 안의 커밋 엔티티 값도 맞추려고 직접 비운다
    // 리뷰는 FK(ON DELETE CASCADE)로 함께 삭제됨
    @Transactional
    public void deletePr(long userId, long repoId, long prId) {
        Pr pr = findEditablePr(userId, repoId, prId, "삭제");
        prRepository.findCommitsByPrId(prId).forEach(commit -> commit.setPrId(null));
        prRepository.delete(pr);
    }

    // 다른 팀 PR 은 존재 여부를 드러내지 않도록 없는 PR 과 같은 404
    private Pr findPr(long repoId, long prId) {
        return prRepository.findByPrIdAndRepoId(prId, repoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PR을 찾을 수 없습니다."));
    }

    // 수정·삭제 공통 검사: 존재(404) → 리뷰 대기 상태(409) → 작성자 본인(403)
    private Pr findEditablePr(long userId, long repoId, long prId, String action) {
        Pr pr = findPr(repoId, prId);
        if (!pr.isOpen()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 PR은 " + action + "할 수 없어요.");
        }
        if (!pr.isWrittenBy(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내가 작성한 PR만 " + action + "할 수 있어요.");
        }
        return pr;
    }

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
            if (commit.getUserId() != userId) {
                throw new IllegalArgumentException("내가 만든 커밋만 PR에 넣을 수 있어요.");
            }
            if (commit.getPrId() != null) {
                throw new IllegalArgumentException("커밋 \"" + commit.getMessage() + "\"은 이미 다른 PR에 연결돼 있어요.");
            }
        }
        return commits;
    }
}
