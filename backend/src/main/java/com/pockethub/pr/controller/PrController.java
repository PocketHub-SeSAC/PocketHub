package com.pockethub.pr.controller;

import com.pockethub.pr.dto.PrCreateRequest;
import com.pockethub.pr.dto.PrDetailResponse;
import com.pockethub.pr.dto.PrRejectRequest;
import com.pockethub.pr.dto.PrSummaryResponse;
import com.pockethub.pr.dto.PrUpdateRequest;
import com.pockethub.pr.service.PrService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/pulls")
public class PrController {
    private final PrService prService;

    public PrController(PrService prService) {
        this.prService = prService;
    }

    // API-029 PR 생성: 내 커밋을 묶어 리뷰 대기(OPEN) 상태로 만든다
    @PostMapping
    public ResponseEntity<PrDetailResponse> createPr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @RequestBody PrCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                prService.createPr(Long.valueOf(authentication.getName()), repoId, request)
        );
    }

    // API-030 PR 목록: ?status= 로 상태 필터 (없으면 전체), 최신순
    @GetMapping
    public ResponseEntity<List<PrSummaryResponse>> getPrs(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @RequestParam(value = "status", required = false) String status
    ) {
        return ResponseEntity.ok(prService.getPrs(Long.valueOf(authentication.getName()), repoId, status));
    }

    // API-031 PR 상세: 커밋 목록 포함
    @GetMapping("/{prId}")
    public ResponseEntity<PrDetailResponse> getPr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId
    ) {
        return ResponseEntity.ok(prService.getPr(Long.valueOf(authentication.getName()), repoId, prId));
    }

    // API-032 PR 승인: 작성자가 아닌 팀원, 리뷰 대기(OPEN) 상태일 때만. 연결 Task 는 DONE 이 된다
    @PostMapping("/{prId}/approve")
    public ResponseEntity<PrDetailResponse> approvePr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId
    ) {
        return ResponseEntity.ok(prService.approvePr(Long.valueOf(authentication.getName()), repoId, prId));
    }

    // API-033 PR 거부: 작성자가 아닌 팀원, 리뷰 대기(OPEN) 상태일 때만. 사유 필수
    @PostMapping("/{prId}/reject")
    public ResponseEntity<PrDetailResponse> rejectPr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId,
            @RequestBody PrRejectRequest request
    ) {
        return ResponseEntity.ok(prService.rejectPr(Long.valueOf(authentication.getName()), repoId, prId, request));
    }

    // PR 수정: 작성자 본인, 리뷰 대기(OPEN) 상태일 때만 제목·설명 수정
    @PatchMapping("/{prId}")
    public ResponseEntity<PrDetailResponse> updatePr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId,
            @RequestBody PrUpdateRequest request
    ) {
        return ResponseEntity.ok(
                prService.updatePr(Long.valueOf(authentication.getName()), repoId, prId, request)
        );
    }

    // PR 삭제: 작성자 본인, 리뷰 대기(OPEN) 상태일 때만. 묶였던 커밋은 다시 PR 에 넣을 수 있게 풀린다
    @DeleteMapping("/{prId}")
    public ResponseEntity<Void> deletePr(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("prId") long prId
    ) {
        prService.deletePr(Long.valueOf(authentication.getName()), repoId, prId);
        return ResponseEntity.noContent().build();
    }
}
