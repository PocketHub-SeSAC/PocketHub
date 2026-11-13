package com.pockethub.file.service;

import com.pockethub.commit.dto.FileState;
import com.pockethub.file.domain.File;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.repository.FileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class FileService {
    private FileRepository fileRepository;

    private final Path uploadRoot;

    public FileService(FileRepository fileRepository, @Value("${upload.dir:uploads}") String uploadDir) {
        this.fileRepository = fileRepository;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    // 다중 파일 업로드
    @Transactional
    public List<FileDTO> uploadFiles(long repoId, String commitId, List<MultipartFile> files) {
        List<FileDTO> fileInfo = new ArrayList<>();

        // 다중 파일 업로드 -> 하면서 FileDTO 만들어 채우기
        try {
            for (MultipartFile file : files) {
                FileDTO info = uploadFile(repoId, commitId, file);
                fileInfo.add(info);
            }
        } catch(IOException e) {
            // TODO : 커스텀 Exception 만들어 처리
            throw new IllegalArgumentException("파일 업로드 도중 문제가 발생했습니다.");
        }

        return fileInfo;
    }

    // 파일 업로드
    @Transactional
    public FileDTO uploadFile(long repoId, String commitId, MultipartFile file) throws IOException {
        validateFile(file);

        Path uploadPath = uploadRoot.resolve(String.valueOf(repoId)).resolve(commitId).normalize();
        // 디렉토리 생성
        Files.createDirectories(uploadPath);

        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        if(fileName.contains("..")) {
            throw new IllegalArgumentException("파일명에 올바르지 않은 경로가 포함되어 있습니다.");
        }
        fileName = Paths.get(fileName).getFileName().toString();

        Path targetPath = uploadPath.resolve(fileName).normalize();

        file.transferTo(targetPath);

        String relativePath = uploadRoot.relativize(targetPath).toString().replace('\\', '/');

        FileDTO info = new FileDTO(fileName, relativePath, commitId, repoId, file.getSize() / 1024.0f);

        File prevFile = fileRepository.findFirstByOriginalNameAndIsLatestOrderByFileIdDesc(info.getOriginalName(), true);
        info.setIsLatest(true);
        if(prevFile != null) {
            prevFile.setIsLatest(false);
            if(prevFile.getState().equals(FileState.DELETE)) {
                info.setState(FileState.ADD);
            } else {
                info.setState(FileState.UPDATE);
                info.setPrevId(prevFile.getFileId());
            }
        } else {
            info.setState(FileState.ADD);
        }

        return info;
    }

    @Transactional
    public FileDTO deleteFile(long repoId, String commitId, long fileId) {
        File prevFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("삭제하려는 파일이 존재하지 않습니다."));
        if(!prevFile.getIsLatest()) {
            throw new IllegalArgumentException("삭제하려는 파일이 최신 파일이 아닙니다. 최신 파일을 선택해주세요.");
        }
        if(prevFile.getState().equals(FileState.DELETE)) {
            throw new IllegalArgumentException("삭제하려는 파일은 이미 삭제되어 있습니다.");
        }

        prevFile.setIsLatest(false);

        FileDTO dto = new FileDTO(prevFile.getOriginalName(), "", commitId, repoId, 0);
        dto.setIsLatest(true);
        dto.setPrevId(prevFile.getFileId());
        dto.setState(FileState.DELETE);

        return dto;
    }

    // 커밋 실패 시, 이미 저장된 파일을 커밋 폴더 채로 정리
    // 파일 경로 : /{repositoryId}/{commitId}/{저장 파일명}
    public void cleanupSavedFiles(long repoId, String commitId, Exception originalException) {
        Path savedPath = uploadRoot.resolve(String.valueOf(repoId)).resolve(commitId).normalize();

        try(Stream<Path> walk = Files.walk(savedPath)) {
            walk.sorted(Comparator.reverseOrder())
                            .forEach(p -> {
                                try {
                                    Files.deleteIfExists(p);
                                } catch (IOException e) {
                                    throw new RuntimeException(e);
                                }
                            });
            Files.deleteIfExists(savedPath);
        } catch (IOException e) {
            originalException.addSuppressed(e);
        }
    }

    // 파일 유효성 검사
    private void validateFile(MultipartFile file) {
        if(file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 비어있습니다.");
        }

        if(file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            throw new IllegalArgumentException("원본 파일명이 없습니다.");
        }
    }
}
