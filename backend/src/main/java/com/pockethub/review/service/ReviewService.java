package com.pockethub.review.service;

import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.common.validation.ValidationRules;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.dto.PrMemberResponse;
import com.pockethub.pr.repository.PrRepository;
import com.pockethub.pr.repository.PrRepository.MemberRow;
import com.pockethub.review.domain.Review;
import com.pockethub.review.dto.ReviewRequest;
import com.pockethub.review.dto.ReviewResponse;
import com.pockethub.review.repository.ReviewRepository;
import com.pockethub.task.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// PR 리뷰(댓글) — 프론트 목업 pulls.js 규칙에 맞춘다
// - 리뷰어 지정 없음: PR 작성자를 뺀 팀원 누구나 작성 가능 (PR 상태와 상관없이)
// - 조회는 팀원 누구나, 수정·삭제는 리뷰 작성자 본인만
@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final PrRepository prRepository;
    private final TaskRepository taskRepository;

    public ReviewService(ReviewRepository reviewRepository, PrRepository prRepository, TaskRepository taskRepository) {
        this.reviewRepository = reviewRepository;
        this.prRepository = prRepository;
        this.taskRepository = taskRepository;
    }

    // API-034 작성
    @Transactional
    public ReviewResponse createReview(long userId, long repoId, long prId, ReviewRequest request) {
        Pr pr = validatePr(userId, repoId, prId);
        if (pr.isWrittenBy(userId)) {
            throw new ForbiddenException("본인이 작성한 PR에는 리뷰를 남길 수 없습니다.");
        }
        String content = validateContent(request.getContent());
        Review review = reviewRepository.save(new Review(userId, content, prId));
        return toResponses(List.of(review)).get(0);
    }

    // API-035 목록: 작성순
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviews(long userId, long repoId, long prId) {
        validatePr(userId, repoId, prId);
        return toResponses(reviewRepository.findByPrIdOrderByReviewIdAsc(prId));
    }

    // API-036 수정: 작성자 본인만, 변경 감지로 저장
    @Transactional
    public ReviewResponse updateReview(long userId, long repoId, long prId, long reviewId, ReviewRequest request) {
        Review review = findOwnReview(userId, repoId, prId, reviewId, "수정");
        review.update(validateContent(request.getContent()));
        return toResponses(List.of(review)).get(0);
    }

    // API-037 삭제: 작성자 본인만
    @Transactional
    public void deleteReview(long userId, long repoId, long prId, long reviewId) {
        Review review = findOwnReview(userId, repoId, prId, reviewId, "삭제");
        reviewRepository.delete(review);
    }

    // 팀(404) → 팀원(403) → 이 팀의 PR(404) — PrService 와 같은 기준·메시지
    // TODO : 팀(Repo·Collaborator) 리포지토리 조회로 교체 (PrService.validateMember 와 함께)
    private Pr validatePr(long userId, long repoId, long prId) {
        if (taskRepository.countTeam(repoId) == 0) {
            throw new NotFoundException("팀을 찾을 수 없습니다.");
        }
        if (taskRepository.countMember(repoId, userId) == 0) {
            throw new ForbiddenException("팀원만 접근할 수 있습니다.");
        }
        // 다른 팀 PR 은 존재 여부를 드러내지 않도록 없는 PR 과 같은 404
        return prRepository.findByPrIdAndRepoId(prId, repoId)
                .orElseThrow(() -> new NotFoundException("PR을 찾을 수 없습니다."));
    }

    // 다른 PR 의 리뷰 번호로 요청하면 없는 리뷰와 같은 404 (URL 의 prId 까지 조건에 넣는 이유)
    private Review findOwnReview(long userId, long repoId, long prId, long reviewId, String action) {
        validatePr(userId, repoId, prId);
        Review review = reviewRepository.findByPrIdAndReviewId(prId, reviewId)
                .orElseThrow(() -> new NotFoundException("리뷰를 찾을 수 없습니다."));
        if (!review.isWrittenBy(userId)) {
            throw new ForbiddenException("내가 쓴 리뷰만 " + action + "할 수 있어요.");
        }
        return review;
    }

    private String validateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("리뷰 내용을 입력해 주세요.");
        }
        String trimmed = content.trim();
        if (trimmed.length() > ValidationRules.REVIEW_COMMENT_MAX) {
            throw new IllegalArgumentException("리뷰는 " + ValidationRules.REVIEW_COMMENT_MAX + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }

    // 작성자 정보를 리뷰 개수와 상관없이 한 번에 조회 (목록 N+1 방지)
    private List<ReviewResponse> toResponses(List<Review> reviews) {
        if (reviews.isEmpty()) {
            return List.of();
        }
        Set<Long> userIds = reviews.stream().map(Review::getUserId).collect(Collectors.toSet());
        Map<Long, MemberRow> members = prRepository.findMembers(userIds).stream()
                .collect(Collectors.toMap(MemberRow::getUserId, Function.identity()));
        return reviews.stream()
                .map(review -> new ReviewResponse(review, author(members, review.getUserId())))
                .toList();
    }

    // 탈퇴 등으로 회원 정보를 못 찾으면 ID 만
    private static PrMemberResponse author(Map<Long, MemberRow> members, long userId) {
        MemberRow row = members.get(userId);
        return (row == null) ? PrMemberResponse.idOnly(userId) : PrMemberResponse.from(row);
    }
}
