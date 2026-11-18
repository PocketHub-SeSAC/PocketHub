package com.pockethub.review.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "review")
@EntityListeners(AuditingEntityListener.class)
@Getter
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;
    @Column(nullable = false)
    private long userId;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private String comment;
    @Column(nullable = false)
    private long prId;

    protected Review(){

    }

    public Review(long userId, String comment, long prId){
        this.userId = userId;
        this.comment = comment;
        this.prId = prId;
    }
    
    public boolean isWrittenBy(long userId) {
        return this.userId == userId;
    }

    public void update(String comment) {
        this.comment = comment;
    }
}
