package com.pockethub.file.controller;

import com.pockethub.common.response.ResponseDTO;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.dto.FileDownloadRes;
import com.pockethub.file.service.FileService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> fileDownload(
            @PathVariable("teamId") long repoId,
            @PathVariable("fileId") long fileId
    ) {
        FileDownloadRes res = fileService.fileDownload(fileId, repoId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.getFileName() + "\"")
//                .header(HttpHeaders.CONTENT_TYPE, res.getMediaType())
//                .header(HttpHeaders.CONTENT_LENGTH, res.getFileLength())
                .body(new FileSystemResource(res.getFile()));
    }

    @GetMapping
    public ResponseEntity<ResponseDTO> searchLatestFiles(@PathVariable("teamId") long repoId) {
        return ResponseEntity.ok(new ResponseDTO(
                Map.of("files", fileService.searchLatestFiles(repoId))
                , "파일 목록 조회에 성공했습니다."
        ));
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<ResponseDTO> findCommitDetail(
            @PathVariable("teamId") long repoId,
            @PathVariable("fileId") long fileId
    ) {
        FileDTO file = fileService.findFileDetail(fileId, repoId);

        return ResponseEntity.ok(new ResponseDTO(
                file.toMap(), "파일 상세 조회에 성공했습니다."
        ));
    }
}
