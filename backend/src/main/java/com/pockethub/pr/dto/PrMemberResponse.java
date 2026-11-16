package com.pockethub.pr.dto;

import com.pockethub.pr.repository.PrRepository.MemberRow;

// PR 작성자·승인자 표시용 (프론트 목업 publicUser 모양)
// TODO : User 엔티티·UserDTO 가 생기면 교체
public record PrMemberResponse(Long userId, String email, String nickname, String profileIcon) {

    public static PrMemberResponse from(MemberRow row) {
        return new PrMemberResponse(row.getUserId(), row.getEmail(), row.getNickname(), row.getIcon());
    }

    // 탈퇴 등으로 회원 정보를 못 찾으면 ID 만
    public static PrMemberResponse idOnly(Long userId) {
        return new PrMemberResponse(userId, null, null, null);
    }
}
