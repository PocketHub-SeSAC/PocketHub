package com.pockethub.pr.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

// TODO : 리뷰어(reviewerIds)는 저장할 테이블이 정해지면 추가
@Setter
@Getter
public class PrCreateRequest {
    private String title;
    private String description;
    private List<String> commitIds;
    private Long taskId;
}
