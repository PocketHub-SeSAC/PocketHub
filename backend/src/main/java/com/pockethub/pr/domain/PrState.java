package com.pockethub.pr.domain;

public enum PrState {
    OPEN,
    APPROVE,
    DENIED;

    // 목록 조회 ?status= 값 변환. 프론트 목업 값(WAITING·APPROVED·CLOSED)도 받는다
    // TODO : 상태 값이 팀에서 확정되면 별칭 정리
    public static PrState from(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return switch (value.trim().toUpperCase()) {
            case "OPEN", "WAITING" -> OPEN;
            case "APPROVE", "APPROVED" -> APPROVE;
            case "DENIED", "CLOSED", "REJECTED" -> DENIED;
            default -> throw new IllegalArgumentException("PR 상태는 OPEN·APPROVE·DENIED 중 하나여야 해요.");
        };
    }
}
