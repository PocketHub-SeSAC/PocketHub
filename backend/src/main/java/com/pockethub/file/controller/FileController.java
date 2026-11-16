package com.pockethub.file.controller;

import com.pockethub.file.dto.FileDownloadRes;
import com.pockethub.file.service.FileService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/{fileId}/download")
    public ResponseEntity<?> fileDownload(
            @PathVariable("teamId") long repoId,
            @PathVariable("fileId") long fileId
    ) {
        FileDownloadRes res = new FileDownloadRes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + res.getFileName() + "\"")
//                .header(HttpHeaders.CONTENT_TYPE, res.getMediaType())
//                .header(HttpHeaders.CONTENT_LENGTH, res.getFileLength())
                .body(new FileSystemResource(res.getFile()));
    }
}
