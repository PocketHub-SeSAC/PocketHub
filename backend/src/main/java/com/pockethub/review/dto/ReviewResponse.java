package com.pockethub.review.dto;

import com.pockethub.pr.dto.PrMemberResponse;
import com.pockethub.review.domain.Review;
import lombok.Getter;

import java.time.LocalDateTime;

// 리뷰 한 건 (프론트 목업 reviewView 모양, type 은 백엔드에 없어 프론트가 COMMENT 로 채움)
@Getter
public class ReviewResponse {
    private final Long reviewId;
    private final PrMemberResponse author;   // 작성자
    private final String content;            // DB review.comment
    private final LocalDateTime createdAt;

    public ReviewResponse(Review review, PrMemberResponse author) {
        this.reviewId = review.getReviewId();
        this.author = author;
        this.content = review.getComment();
        this.createdAt = review.getCreatedAt();
    }
}
