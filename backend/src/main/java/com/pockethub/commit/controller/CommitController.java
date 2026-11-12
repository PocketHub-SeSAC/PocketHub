package com.pockethub.commit.controller;

import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.commit.service.CommitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/commits")
public class CommitController {
    private final CommitService commitService;

    public CommitController(CommitService commitService) {
        this.commitService = commitService;
    }

    // 업로드 커밋 2. 업로드한 파일을 정보와 함께 커밋 메세지 등록 (파일 DB, 커밋 DB 여기서 다 등록)
    @PostMapping
    public ResponseEntity<CommitDTO> uploadCommit(
            Authentication authentication // 테스트할 때는 임시로 userId 부분에 1 을 넣는다
            , @PathVariable("teamId") long repoId
            , @RequestParam("files") List<MultipartFile> files
            , @RequestParam("commitMessage") String commitMessage
            ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                commitService.uploadCommit(Long.valueOf(authentication.getName()), repoId, files, commitMessage)
        );
    }
}
