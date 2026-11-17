package com.pockethub.file.service;

import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.common.exception.FileNotCleanupException;
import com.pockethub.common.exception.FileNotCreatedException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.file.domain.File;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.dto.FileDownloadRes;
import com.pockethub.file.dto.FileState;
import com.pockethub.file.repository.FileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
            throw new FileNotCreatedException("파일 업로드 도중 문제가 발생했습니다.");
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

        File prevFile = fileRepository.findFirstByOriginalNameAndIsLatestOrderByFileIdDesc(info.getFileName(), true);
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
        File prevFile = fileRepository.findByFileIdAndRepoId(fileId, repoId);
        if(prevFile == null) {
            throw new NotFoundException("삭제하려는 파일이 존재하지 않습니다.");
        }
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

    // 파일 경로 : /{repositoryId}/{commitId}/{저장 파일명}
    public void cleanupSavedFiles(long repoId, String commitId) throws IOException {
        Path savedPath = commitId == null ? uploadRoot.resolve(String.valueOf(repoId)).normalize()
                : uploadRoot.resolve(String.valueOf(repoId)).resolve(commitId).normalize();

        java.io.File savedFile = new java.io.File(savedPath.toString());
        if(!savedFile.exists()) return;

        try(Stream<Path> walk = Files.walk(savedPath)) {
            walk.sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException e) {
                            throw new FileNotCleanupException("임시 저장된 파일을 삭제하는 도중 문제가 발생했습니다.");
                        }
                    });
            Files.deleteIfExists(savedPath);
        }
    }

    // 커밋 실패 시, 이미 저장된 파일을 커밋 폴더 채로 정리
    public void cleanupSavedFiles(long repoId, String commitId, Exception originalException) {
        try {
            cleanupSavedFiles(repoId, commitId);
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

    @Transactional(readOnly = true)
    public FileDownloadRes fileDownload(long fileId, long repoId) {
        // 조회에서 repository 에 find 추가해놨으니 머지되면 가져와서 사용 교체
        File file = fileRepository.findByFileIdAndRepoId(fileId, repoId);
        if(file == null) {
            throw new NotFoundException("파일을 찾을 수 없습니다.");
        }

        FileDownloadRes res = new FileDownloadRes();
        res.setFileName(file.getOriginalName());
        Path filePath = uploadRoot.resolve(file.getFilePath()).normalize();
        res.setFile(new java.io.File(filePath.toString()));

        return res;
    }

    // 대용량 처리를 위해서 로컬에 Zip 파일을 만들어 다운로드
    public FileDownloadRes fileDownload(CommitDTO commitDTO) {
        FileDownloadRes res = new FileDownloadRes();
        int count = 0;

        try {
            Path tempUploadPath = uploadRoot.resolve("temp").normalize();
            Files.createDirectories(tempUploadPath);
            Path savedPath = tempUploadPath.resolve(commitDTO.getCommitId() + ".zip").normalize();

            try(FileOutputStream fos = new FileOutputStream(savedPath.toString());
                ZipOutputStream zos = new ZipOutputStream(fos)) {

                byte[] buffer = new byte[1024];

                for(FileDTO fileDTO : commitDTO.getFiles()) {
                    if(fileDTO.getState().equals(FileState.DELETE)) continue;

                    // 파일을 압축하는 로직
                    Path filePath = uploadRoot.resolve(fileDTO.getFilePath()).normalize();
                    java.io.File originalFile = new java.io.File(filePath.toString());
                    if(!originalFile.exists()) continue;

                    try(FileInputStream fis = new FileInputStream(originalFile)) {
                        ZipEntry zipEntry = new ZipEntry(fileDTO.getFileName());
                        zos.putNextEntry(zipEntry);

                        int length;
                        while((length = fis.read(buffer)) > 0) {
                            zos.write(buffer, 0, length);
                        }
                        zos.closeEntry();
                    }

                    count++;
                }
            } catch (FileNotFoundException e) {
                throw new NotFoundException("파일을 찾을 수 없습니다.");
            }

            if(count == 0) {
                throw new NotFoundException("해당 Commit 에 다운로드 가능한 파일이 존재하지 않습니다.");
            }

            res.setFileName(commitDTO.getCommitId() + ".zip");
            res.setFile(new java.io.File(savedPath.toString()));
        } catch (IOException e) {
            throw new FileNotCreatedException("임시 파일 생성 중 문제가 발생했습니다.");
        }

        return res;
    }

    @Transactional(readOnly = true)
    public List<FileDTO> searchLatestFiles(long repoId) {
        // 상태가 DELETE 가 아닌 최신 파일들을 가져온다.
        List<File> files = fileRepository.searchLatestFiles(repoId);

        return files.stream().map(FileDTO::new).toList();
    }

    @Transactional(readOnly = true)
    public FileDTO findFileDetail(long fileId, long repoId) {
        File file = fileRepository.findByFileIdAndRepoId(fileId, repoId);

        if(file == null) {
            throw new NotFoundException("조회하려는 파일 정보가 존재하지 않습니다.");
        }

        return new FileDTO(file);
    }
}
