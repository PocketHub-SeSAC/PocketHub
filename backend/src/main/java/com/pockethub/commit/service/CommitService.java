package com.pockethub.commit.service;

import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.file.domain.File;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.repository.FileRepository;
import com.pockethub.file.service.FileService;
import com.pockethub.user.domain.User;
import com.pockethub.user.dto.UserResponse;
import com.pockethub.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class CommitService {
    private final CommitRepository commitRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileService fileService;

    public CommitService(CommitRepository commitRepository, FileRepository fileRepository, UserRepository userRepository, FileService fileService) {
        this.commitRepository = commitRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileService = fileService;
    }

    @Transactional
    public CommitDTO uploadCommit(long userId, long repoId, List<MultipartFile> files, String commitMessage) {
        // 1. commitId 생성
        String commitId = createCommitId();
        CommitDTO commitDTO = new CommitDTO(commitId, commitMessage);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("유저 정보가 존재하지 않습니다."));
        commitDTO.setUser(UserResponse.from(user));

        try {
            // 2. 파일 업로드
            List<FileDTO> fileList = fileService.uploadFiles(repoId, commitId, files);

            // 3. DB 에 추가
            commitRepository.save(new Commit(commitId, repoId, user, commitMessage));
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

    @Transactional
    public CommitDTO deleteCommit(long userId, long repoId, long fileId, String commitMessage) {
        String commitId = createCommitId();
        CommitDTO commitDTO = new CommitDTO(commitId, commitMessage);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("유저 정보가 존재하지 않습니다."));
        commitDTO.setUser(UserResponse.from(user));

        FileDTO info = fileService.deleteFile(repoId, commitId, fileId);

        commitRepository.save(new Commit(commitId, repoId, user, commitMessage));
        File file = fileRepository.save(new File(info));

        info.setFileId(file.getFileId());
        commitDTO.setFiles(List.of(info));

        return commitDTO;
    }

    private String createCommitId() {
        String commitId = UUID.randomUUID().toString();

        // 1-1. 이미 존재하는 commitId 인가 확인
        boolean isExist = commitRepository.existsById(commitId);
        while(isExist) {
            commitId = UUID.randomUUID().toString();
            isExist = commitRepository.existsById(commitId);
        }

        return commitId;
    }

    @Transactional(readOnly = true)
    public Page<CommitDTO> findCommitList(long repoId, Pageable pageable) {
        Page<CommitDTO> commitList = commitRepository.findByRepoId(repoId, pageable)
                .map(CommitDTO::new);

        return commitList;
    }

    @Transactional(readOnly = true)
    public CommitDTO findCommitDetail(String commitId, long repoId) {
        Commit commit = commitRepository.findByCommitIdAndRepoId(commitId, repoId);

        if(commit == null) {
            throw new NotFoundException("조회하려는 커밋이 존재하지 않습니다.");
        }

        return new CommitDTO(commit);
    }
}
