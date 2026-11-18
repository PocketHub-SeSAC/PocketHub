package com.pockethub.review.controller;

import com.pockethub.review.dto.ReviewRequest;
import com.pockethub.review.dto.ReviewResponse;
import com.pockethub.review.service.ReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/pulls/{prId}/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // API-034 리뷰 작성
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId,
            @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                reviewService.createReview(Long.valueOf(authentication.getName()), repoId, prId, request)
        );
    }

    // API-035 리뷰 목록: 작성순
    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviews(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId
    ) {
        return ResponseEntity.ok(reviewService.getReviews(Long.valueOf(authentication.getName()), repoId, prId));
    }

    // API-036 리뷰 수정: 작성자 본인만
    @PatchMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId,
            @PathVariable("reviewId") long reviewId,
            @RequestBody ReviewRequest request
    ) {
        return ResponseEntity.ok(
                reviewService.updateReview(Long.valueOf(authentication.getName()), repoId, prId, reviewId, request)
        );
    }

    // API-037 리뷰 삭제: 작성자 본인만
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId,
            @PathVariable("reviewId") long reviewId
    ) {
        reviewService.deleteReview(Long.valueOf(authentication.getName()), repoId, prId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
