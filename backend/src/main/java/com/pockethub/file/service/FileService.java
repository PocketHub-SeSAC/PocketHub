package com.pockethub.file.service;

import com.pockethub.file.repository.FileRepository;
import org.springframework.stereotype.Service;

@Service
public class FileService {
    private FileRepository fileRepository;

    public FileService(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }
}
