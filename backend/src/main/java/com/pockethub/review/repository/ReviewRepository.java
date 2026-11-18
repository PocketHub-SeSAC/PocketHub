package com.pockethub.review.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pockethub.review.domain.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByPrIdOrderByReviewIdAsc(long prId);
    Optional<Review> findByPrIdAndReviewId(long prId, long reviewId);
}
