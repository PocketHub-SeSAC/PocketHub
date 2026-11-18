package com.pockethub.team.controller;

import com.pockethub.common.response.ResponseDTO;
import lombok.RequiredArgsConstructor;
import com.pockethub.team.dto.*;
import com.pockethub.team.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/teams")
public class TeamController {

    private final TeamService teamService;

    // ===== 팀 =====

    // 팀생성
    @PostMapping
    public ResponseEntity<ResponseDTO> createTeam(
            @AuthenticationPrincipal Long loginUserId,
            @RequestBody CreateTeamRequest request) {
        TeamResponse response = teamService.createTeam(loginUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDTO(HttpStatus.CREATED, Map.of("team", response), "팀이 생성되었습니다."));
    }

    // 내가 속한 팀 목록 조회
    @GetMapping
    public ResponseEntity<ResponseDTO> getTeams(@AuthenticationPrincipal Long loginUserId) {
        return ResponseEntity.ok(new ResponseDTO(Map.of("teams", teamService.getTeams(loginUserId)), "팀 목록 조회 성공"));
    }

    // 팀 상세 조회
    @GetMapping("/{teamId}")
    public ResponseEntity<ResponseDTO> getTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(new ResponseDTO(Map.of("team", teamService.getTeam(teamId)),  "팀 상세 조회 성공"));
    }

    // 팀 수정
    @PatchMapping("/{teamId}")
    public ResponseEntity<ResponseDTO> updateTeam(
            @AuthenticationPrincipal Long loginUserId,
            @PathVariable Long teamId,
            @RequestBody UpdateTeamRequest request) {
        TeamResponse response = teamService.updateTeam(loginUserId, teamId, request);
        return ResponseEntity.ok(new ResponseDTO(Map.of("team", response), "팀 정보가 수정되었습니다."));
    }

    // 팀 삭제
    @DeleteMapping("/{teamId}")
    public ResponseEntity<ResponseDTO> deleteTeam(
            @AuthenticationPrincipal Long loginUserId,
            @PathVariable Long teamId) {
        teamService.deleteTeam(loginUserId, teamId);
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, "팀이 삭제되었습니다."));
    }

    // ===== 팀원 =====

    // 팀원 목록 조회
    @GetMapping("/{teamId}/members")
    public ResponseEntity<ResponseDTO> getMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(new ResponseDTO(Map.of("members", teamService.getMembers(teamId)), "팀원 목록 조회 성공"));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<ResponseDTO> addMember(
            @AuthenticationPrincipal Long loginUserId,
            @PathVariable Long teamId,
            @RequestBody AddMemberRequest request) {
        TeamMemberResponse member = teamService.addMember(loginUserId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ResponseDTO(HttpStatus.CREATED, Map.of("member", member), "팀원이 추가되었습니다."));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ResponseDTO> removeMember(
            @AuthenticationPrincipal Long loginUserId,
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        teamService.removeMember(loginUserId, teamId, userId);
        return ResponseEntity.ok(new ResponseDTO(HttpStatus.OK, "팀원이 삭제되었습니다."));
    }

}