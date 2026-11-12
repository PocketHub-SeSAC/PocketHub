package com.pockethub.commit.service;

import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.file.domain.File;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.repository.FileRepository;
import com.pockethub.file.service.FileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class CommitService {
    private final CommitRepository commitRepository;
    private final FileRepository fileRepository;
    private final FileService fileService;

    public CommitService(CommitRepository commitRepository, FileRepository fileRepository, FileService fileService) {
        this.commitRepository = commitRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
    }

    @Transactional
    public CommitDTO uploadCommit(long userId, long repoId, List<MultipartFile> files, String commitMessage) {
        // 1. commitId 생성
        String commitId = UUID.randomUUID().toString();

        // 1-1. 이미 존재하는 commitId 인가 확인
        boolean isExist = commitRepository.existsById(commitId);
        while(isExist) {
            commitId = UUID.randomUUID().toString();
            isExist = commitRepository.existsById(commitId);
        }

        CommitDTO commitDTO = new CommitDTO(commitId, commitMessage);

        try {
            // 2. 파일 업로드
            List<FileDTO> fileList = fileService.uploadFiles(repoId, commitId, files);

            // 3. DB 에 추가
            commitRepository.save(new Commit(commitId, repoId, userId, commitMessage));
            for(FileDTO f : fileList) {
                File file = fileRepository.save(new File(f));
                f.setFileId(file.getFileId());
            }

            commitDTO.setFiles(fileList);
        } catch(Exception e) {
            fileService.cleanupSavedFiles(repoId, commitId, e);
            System.out.println(e.getMessage());
            throw e;
        }

        return commitDTO;
    }
}
