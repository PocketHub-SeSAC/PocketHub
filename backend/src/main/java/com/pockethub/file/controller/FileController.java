package com.pockethub.file.controller;

import com.pockethub.commit.dto.CommitReq;
import com.pockethub.commit.dto.CommitRes;
import com.pockethub.file.service.FileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // 업로드 커밋 1. 여러 파일 업로드
    @PostMapping
    // TODO : fileId 리스트를 담은 Response 객체 반환
    public ResponseEntity<Void> uploadFiles(
            Authentication authentication
            , @PathVariable("teamId") long repoId
            , @RequestParam("files") List<MultipartFile> files
            ) {

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
