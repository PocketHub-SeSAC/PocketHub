package com.pockethub.file.controller;

import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/files")
public class FileController {
    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping
    public ResponseEntity<List<FileDTO>> searchLatestFiles(@PathVariable("teamId") long repoId) {
        return ResponseEntity.ok(fileService.searchLatestFiles(repoId));
    }
}
