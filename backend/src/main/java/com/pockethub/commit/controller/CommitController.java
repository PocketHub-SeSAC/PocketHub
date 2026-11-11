package com.pockethub.commit.controller;

import com.pockethub.commit.dto.CommitReq;
import com.pockethub.commit.dto.CommitRes;
import com.pockethub.commit.service.CommitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/commits")
public class CommitController {
    private final CommitService commitService;

    public CommitController(CommitService commitService) {
        this.commitService = commitService;
    }

    // 업로드 커밋 2. 업로드한 파일을 정보와 함께 커밋 메세지 등록 (파일 DB, 커밋 DB 여기서 다 등록)
    @PostMapping
    public ResponseEntity<CommitRes> commit(
            Authentication authentication
            , @PathVariable("teamId") long repoId
            , @RequestBody CommitReq commitReq
            ) {

        return ResponseEntity.status(HttpStatus.CREATED).body(new CommitRes());
    }
}
