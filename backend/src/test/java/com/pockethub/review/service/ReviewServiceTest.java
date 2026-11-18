package com.pockethub.review.service;

import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.repository.PrRepository;
import com.pockethub.pr.repository.PrRepository.MemberRow;
import com.pockethub.review.domain.Review;
import com.pockethub.review.dto.ReviewRequest;
import com.pockethub.review.dto.ReviewResponse;
import com.pockethub.review.repository.ReviewRepository;
import com.pockethub.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    private static final long REPO_ID = 1L;
    private static final long AUTHOR_ID = 1L;
    private static final long OTHER_USER_ID = 2L;
    private static final long NON_MEMBER_ID = 999L;
    private static final long PR_ID = 10L;
    private static final long OTHER_PR_ID = 20L;
    private static final long REVIEW_ID = 30L;

    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private PrRepository prRepository;
    @Mock
    private TaskRepository taskRepository;
    @InjectMocks
    private ReviewService reviewService;

    // 기본: 1번 팀이 있고, 요청자는 팀원이며, 10번 PR 은 1번 팀 소속
    @BeforeEach
    void stubDefaults() {
        lenient().when(taskRepository.countTeam(REPO_ID)).thenReturn(1L);
        lenient().when(taskRepository.countMember(eq(REPO_ID), anyLong())).thenReturn(1L);
        lenient().when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID))
                .thenReturn(Optional.of(new Pr("PR", "", REPO_ID, null, AUTHOR_ID)));
        lenient().when(prRepository.findMembers(anyCollection())).thenReturn(List.of(
                member(AUTHOR_ID, "새싹"), member(OTHER_USER_ID, "달팽이")));
    }

    @Nested
    @DisplayName("리뷰 작성")
    class Create {

        @Test
        @DisplayName("팀원이 쓰면 앞뒤 공백을 지우고 저장하며, 작성자 정보를 함께 돌려준다")
        void success() {
            when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> withId(inv.getArgument(0), REVIEW_ID));

            ReviewResponse response = reviewService.createReview(OTHER_USER_ID, REPO_ID, PR_ID, request("  좋아요  "));

            assertThat(response.getReviewId()).isEqualTo(REVIEW_ID);
            assertThat(response.getContent()).isEqualTo("좋아요");
            assertThat(response.getAuthor().nickname()).isEqualTo("달팽이");
        }

        @Test
        @DisplayName("PR 작성자 본인은 403, 저장하지 않는다")
        void prAuthor() {
            assertThatThrownBy(() -> reviewService.createReview(AUTHOR_ID, REPO_ID, PR_ID, request("셀프 리뷰")))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("본인이 작성한 PR에는 리뷰를 남길 수 없습니다.");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("승인·거부로 처리된 PR 이면 409, 저장하지 않는다")
        void decidedPr() {
            decidePr();

            assertThatThrownBy(() -> reviewService.createReview(OTHER_USER_ID, REPO_ID, PR_ID, request("늦은 리뷰")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessage("이미 처리된 PR에는 리뷰를 남길 수 없습니다.");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("내용이 비어 있으면 400")
        void blank() {
            assertThatThrownBy(() -> reviewService.createReview(OTHER_USER_ID, REPO_ID, PR_ID, request(" ")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("리뷰 내용을 입력해 주세요.");
            verify(reviewRepository, never()).save(any());
        }

        @Test
        @DisplayName("4000자를 넘으면 400")
        void tooLong() {
            assertThatThrownBy(() -> reviewService.createReview(OTHER_USER_ID, REPO_ID, PR_ID, request("가".repeat(4001))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("리뷰는 4000자 이하로 입력해 주세요.");
        }

        @Test
        @DisplayName("다른 팀 PR 이거나 없는 PR 이면 404")
        void prNotFound() {
            when(prRepository.findByPrIdAndRepoId(OTHER_PR_ID, REPO_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.createReview(OTHER_USER_ID, REPO_ID, OTHER_PR_ID, request("리뷰")))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessage("PR을 찾을 수 없습니다.");
        }
    }

    @Nested
    @DisplayName("리뷰 목록")
    class GetList {

        @Test
        @DisplayName("작성순으로 작성자 정보와 함께 돌려준다")
        void success() {
            when(reviewRepository.findByPrIdOrderByReviewIdAsc(PR_ID)).thenReturn(List.of(
                    review(1L, AUTHOR_ID, "첫 리뷰"), review(2L, OTHER_USER_ID, "두 번째")));

            List<ReviewResponse> responses = reviewService.getReviews(AUTHOR_ID, REPO_ID, PR_ID);

            assertThat(responses).extracting(ReviewResponse::getContent).containsExactly("첫 리뷰", "두 번째");
            assertThat(responses).extracting(r -> r.getAuthor().nickname()).containsExactly("새싹", "달팽이");
        }

        @Test
        @DisplayName("리뷰가 없으면 빈 목록, 회원 조회도 하지 않는다")
        void empty() {
            when(reviewRepository.findByPrIdOrderByReviewIdAsc(PR_ID)).thenReturn(List.of());

            assertThat(reviewService.getReviews(AUTHOR_ID, REPO_ID, PR_ID)).isEmpty();
            verify(prRepository, never()).findMembers(anyCollection());
        }

        @Test
        @DisplayName("작성자 회원 정보를 못 찾으면 ID 만 담는다")
        void unknownAuthor() {
            when(reviewRepository.findByPrIdOrderByReviewIdAsc(PR_ID)).thenReturn(List.of(review(1L, 77L, "리뷰")));

            ReviewResponse response = reviewService.getReviews(AUTHOR_ID, REPO_ID, PR_ID).get(0);

            assertThat(response.getAuthor().userId()).isEqualTo(77L);
            assertThat(response.getAuthor().nickname()).isNull();
        }
    }

    @Nested
    @DisplayName("리뷰 수정")
    class Update {

        @Test
        @DisplayName("작성자 본인이면 내용이 바뀐다")
        void success() {
            Review review = review(REVIEW_ID, AUTHOR_ID, "처음");
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.of(review));

            ReviewResponse response = reviewService.updateReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID, request(" 고침 "));

            assertThat(response.getContent()).isEqualTo("고침");
            assertThat(review.getComment()).isEqualTo("고침");
        }

        @Test
        @DisplayName("다른 사람이 쓴 리뷰면 403, 내용은 그대로")
        void notAuthor() {
            Review review = review(REVIEW_ID, AUTHOR_ID, "처음");
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> reviewService.updateReview(OTHER_USER_ID, REPO_ID, PR_ID, REVIEW_ID, request("고침")))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("내가 쓴 리뷰만 수정할 수 있어요.");
            assertThat(review.getComment()).isEqualTo("처음");
        }

        @Test
        @DisplayName("처리된 PR 의 리뷰면 409, 내용은 그대로")
        void decidedPr() {
            decidePr();

            assertThatThrownBy(() -> reviewService.updateReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID, request("고침")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessage("이미 처리된 PR의 리뷰는 수정할 수 없어요.");
            verify(reviewRepository, never()).findByPrIdAndReviewId(anyLong(), anyLong());
        }

        @Test
        @DisplayName("이 PR 의 리뷰가 아니면(다른 PR 의 리뷰 번호) 404")
        void reviewOfOtherPr() {
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.updateReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID, request("고침")))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessage("리뷰를 찾을 수 없습니다.");
        }

        @Test
        @DisplayName("내용이 비어 있으면 400, 내용은 그대로")
        void blank() {
            Review review = review(REVIEW_ID, AUTHOR_ID, "처음");
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> reviewService.updateReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID, request("")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("리뷰 내용을 입력해 주세요.");
            assertThat(review.getComment()).isEqualTo("처음");
        }
    }

    @Nested
    @DisplayName("리뷰 삭제")
    class Delete {

        @Test
        @DisplayName("작성자 본인이면 삭제된다")
        void success() {
            Review review = review(REVIEW_ID, AUTHOR_ID, "리뷰");
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.of(review));

            reviewService.deleteReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID);

            verify(reviewRepository).delete(review);
        }

        @Test
        @DisplayName("다른 사람이 쓴 리뷰면 403, 삭제하지 않는다")
        void notAuthor() {
            Review review = review(REVIEW_ID, AUTHOR_ID, "리뷰");
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.of(review));

            assertThatThrownBy(() -> reviewService.deleteReview(OTHER_USER_ID, REPO_ID, PR_ID, REVIEW_ID))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("내가 쓴 리뷰만 삭제할 수 있어요.");
            verify(reviewRepository, never()).delete(any());
        }

        @Test
        @DisplayName("처리된 PR 의 리뷰면 409, 삭제하지 않는다")
        void decidedPr() {
            decidePr();

            assertThatThrownBy(() -> reviewService.deleteReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID))
                    .isInstanceOf(ConflictException.class)
                    .hasMessage("이미 처리된 PR의 리뷰는 삭제할 수 없어요.");
            verify(reviewRepository, never()).delete(any());
        }

        @Test
        @DisplayName("없는 리뷰면 404")
        void notFound() {
            when(reviewRepository.findByPrIdAndReviewId(PR_ID, REVIEW_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reviewService.deleteReview(AUTHOR_ID, REPO_ID, PR_ID, REVIEW_ID))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("팀원 확인")
    class Member {

        @Test
        @DisplayName("팀이 없으면 404")
        void teamNotFound() {
            when(taskRepository.countTeam(99L)).thenReturn(0L);

            assertThatThrownBy(() -> reviewService.getReviews(AUTHOR_ID, 99L, PR_ID))
                    .isInstanceOf(NotFoundException.class)
                    .hasMessage("팀을 찾을 수 없습니다.");
        }

        @Test
        @DisplayName("팀원이 아니면 403 (목록·작성 모두)")
        void notMember() {
            when(taskRepository.countMember(REPO_ID, NON_MEMBER_ID)).thenReturn(0L);

            assertThatThrownBy(() -> reviewService.getReviews(NON_MEMBER_ID, REPO_ID, PR_ID))
                    .isInstanceOf(ForbiddenException.class)
                    .hasMessage("팀원만 접근할 수 있습니다.");
            assertThatThrownBy(() -> reviewService.createReview(NON_MEMBER_ID, REPO_ID, PR_ID, request("리뷰")))
                    .isInstanceOf(ForbiddenException.class);
            verify(reviewRepository, never()).save(any());
        }
    }

    // ---------- 도우미 ----------

    // 10번 PR 을 승인된(처리된) 상태로 바꿔 둔다
    private void decidePr() {
        Pr approved = new Pr("PR", "", REPO_ID, null, AUTHOR_ID);
        approved.approve(OTHER_USER_ID);
        when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(approved));
    }

    private static ReviewRequest request(String content) {
        ReviewRequest request = new ReviewRequest();
        request.setContent(content);
        return request;
    }

    private static Review review(long reviewId, long userId, String comment) {
        return withId(new Review(userId, comment, PR_ID), reviewId);
    }

    private static Review withId(Review review, long reviewId) {
        ReflectionTestUtils.setField(review, "reviewId", reviewId);
        return review;
    }

    private static MemberRow member(long userId, String nickname) {
        return new MemberRow() {
            public Long getUserId() { return userId; }
            public String getEmail() { return nickname + "@test.com"; }
            public String getNickname() { return nickname; }
            public String getIcon() { return null; }
        };
    }
}
