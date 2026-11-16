package com.pockethub.commit.controller;

import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.commit.service.CommitService;
import com.pockethub.common.response.ResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/commits")
public class CommitController {
    private final CommitService commitService;

    public CommitController(CommitService commitService) {
        this.commitService = commitService;
    }

    // 업로드 커밋 2. 업로드한 파일을 정보와 함께 커밋 메세지 등록 (파일 DB, 커밋 DB 여기서 다 등록)
    @PostMapping
    public ResponseEntity<ResponseDTO> uploadCommit(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("commitMessage") String commitMessage
            ) {
        CommitDTO commitDTO = commitService.uploadCommit(Long.valueOf(authentication.getName()), repoId, files, commitMessage);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ResponseDTO(Map.of(
                        "commitId", commitDTO.getCommitId(),
                        "commitMessage", commitDTO.getCommitMessage(),
                        "files", commitDTO.getFiles()
                ))
        );
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<ResponseDTO> deleteCommit(
            Authentication authentication,
            @PathVariable("teamId") long repoId,
            @PathVariable("fileId") long fileId,
            @RequestParam("commitMessage") String commitMessage
    ) {
        CommitDTO commitDTO = commitService.deleteCommit(Long.valueOf(authentication.getName()), repoId, fileId, commitMessage);

        return ResponseEntity.ok(
                new ResponseDTO(Map.of(
                        "commitId", commitDTO.getCommitId(),
                        "commitMessage", commitDTO.getCommitMessage(),
                        "file", commitDTO.getFiles().getFirst()
                ))
        );
    }

    @GetMapping
    public ResponseEntity<ResponseDTO> findCommitList(
            @PathVariable("teamId") long repoId,
            @PageableDefault(size=10, page=0, sort="createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CommitDTO> commitList = commitService.findCommitList(repoId, pageable);

        return ResponseEntity.ok(new ResponseDTO(Map.of(
                "commits", commitList.getContent(),
                "page", commitList.getNumber(),
                "size", commitList.getSize(),
                "totalElements", commitList.getTotalElements(),
                "totalPages", commitList.getTotalPages()
        ), "Commit 목록 조회에 성공했습니다."));
    }
}
