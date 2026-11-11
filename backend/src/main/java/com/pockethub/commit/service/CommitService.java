package com.pockethub.commit.service;

import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.file.service.FileService;
import org.springframework.stereotype.Service;

@Service
public class CommitService {
    private final CommitRepository commitRepository;
    private final FileService fileService;

    public CommitService(CommitRepository commitRepository, FileService fileService) {
        this.commitRepository = commitRepository;
        this.fileService = fileService;
    }
}
