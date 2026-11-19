package com.pockethub.pr.dto;

import lombok.Getter;
import lombok.Setter;

// PR 수정: 제목·설명만 바꾼다 (커밋·Task 변경은 PR 을 지우고 다시 만든다)
@Setter
@Getter
public class PrUpdateRequest {
    private String title;
    private String description;
}
