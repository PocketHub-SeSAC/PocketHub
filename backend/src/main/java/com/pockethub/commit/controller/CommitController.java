package com.pockethub.commit.controller;

import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.commit.service.CommitService;
import com.pockethub.common.response.PageResponse;
import com.pockethub.common.response.ResponseDTO;
import com.pockethub.file.dto.FileDownloadRes;
import com.pockethub.file.dto.TempFileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
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
                        "message", commitDTO.getMessage(),
                        "files", commitDTO.getFiles()
                ), "파일이 업로드되었습니다.")
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
                        "message", commitDTO.getMessage(),
                        "file", commitDTO.getFiles().getFirst()
                ), "파일이 삭제되었습니다.")
        );
    }

    @GetMapping
    public ResponseEntity<ResponseDTO> findCommitList(
            @PathVariable("teamId") long repoId,
            @PageableDefault(size=10, page=0, sort="createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<CommitDTO> commitList = commitService.findCommitList(repoId, pageable);

        return ResponseEntity.ok(new ResponseDTO(Map.of(
                "commits", commitList.getContent()
            ), "Commit 목록 조회에 성공했습니다.", new PageResponse<>(commitList)
        ));
    }

    @GetMapping("/{commitId}")
    public ResponseEntity<ResponseDTO> findCommitDetail(
            @PathVariable("teamId") long repoId,
            @PathVariable("commitId") String commitId
    ) {
        CommitDTO commit = commitService.findCommitDetail(commitId, repoId);

        return ResponseEntity.ok(new ResponseDTO(
                Map.of(
                        "commitId", commit.getCommitId(),
                        "message", commit.getMessage(),
                        "authorId", commit.getUser().getUserId(),
                        "authorNickname", commit.getUser().getNickname(),
                        "createdAt", commit.getCreatedAt(),
                        "files", commit.getFiles()
                ), "Commit 상세 조회에 성공했습니다."
        ));
    }

    @GetMapping("/{commitId}/download")
    public ResponseEntity<Resource> downloadCommitFiles(
            @PathVariable("teamId") long repoId,
            @PathVariable("commitId") String commitId
    ) {
        FileDownloadRes res = commitService.downloadCommitFiles(commitId, repoId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.getFileName() + "\"")
//                .header(HttpHeaders.CONTENT_TYPE, res.getMediaType())
//                .header(HttpHeaders.CONTENT_LENGTH, res.getFileLength())
                .body(new TempFileSystemResource(res.getFile()));
    }
}
