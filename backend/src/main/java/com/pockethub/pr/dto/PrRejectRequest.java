package com.pockethub.pr.dto;

import lombok.Getter;
import lombok.Setter;

// PR 거부: 사유 필수, DB pr.reply 에 저장
@Setter
@Getter
public class PrRejectRequest {
    private String reason;
}
