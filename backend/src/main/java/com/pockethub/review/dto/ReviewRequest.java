package com.pockethub.review.dto;

import lombok.Getter;
import lombok.Setter;

// 리뷰 작성·수정 요청: 프론트는 {"content": "..."} 로 보내고, DB 에는 review.comment 로 저장
@Setter
@Getter
public class ReviewRequest {
    private String content;
}
