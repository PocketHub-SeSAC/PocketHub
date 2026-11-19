package com.pockethub.pr.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

// 리뷰어는 지정하지 않는다: PR 작성자를 뺀 팀원 누구나 리뷰 가능 (프론트가 reviewerIds 를 보내도 무시)
@Setter
@Getter
public class PrCreateRequest {
    private String title;
    private String description;
    private List<String> commitIds;
    private Long taskId;
}
