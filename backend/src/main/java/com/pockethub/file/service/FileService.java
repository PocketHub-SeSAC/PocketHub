package com.pockethub.file.service;

import com.pockethub.commit.dto.CommitDTO;
import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.FileNotCleanupException;
import com.pockethub.common.exception.FileNotCreatedException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.file.domain.File;
import com.pockethub.file.dto.FileDTO;
import com.pockethub.file.dto.FileDownloadRes;
import com.pockethub.file.dto.FileState;
import com.pockethub.file.repository.FileRepository;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import com.pockethub.pr.repository.PrRepository;
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
    private final FileRepository fileRepository;
    private final PrRepository prRepository;

    private final Path uploadRoot;

    public FileService(FileRepository fileRepository, PrRepository prRepository, @Value("${upload.dir:uploads}") String uploadDir) {
        this.fileRepository = fileRepository;
        this.prRepository = prRepository;
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

        File prevFile = fileRepository.findFirstByOriginalNameAndRepoIdAndIsLatestOrderByFileIdDesc(info.getFileName(), repoId, true);
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
            throw new ConflictException("삭제하려는 파일이 최신 파일이 아닙니다. 최신 파일을 선택해주세요.");
        }
        if(prevFile.getState().equals(FileState.DELETE)) {
            throw new ConflictException("삭제하려는 파일은 이미 삭제되어 있습니다.");
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

    // 작업이 취소되지 않을 정도의 오류가 있을 경우 메세지만 반환
    @Transactional
    public StringBuilder revertLatestFile(List<String> commitIds) {
        StringBuilder errMsg = null;

        List<File> files = prRepository.findFilesByCommitIds(commitIds);
        for(int i = 0; i < files.size(); i++) {
            File file = files.get(i);
            // 1. 최신 파일인가 체크
            if(!file.getIsLatest()) continue;
            file.setIsLatest(false);

            // 2. 최신 파일일 경우 이전 상태 파일이 존재하는가 확인
            if(file.getPrevId() != null) {
                File prevFile = fileRepository.findById(file.getPrevId())
                        .orElse(null);
                if(prevFile == null) {
                    if(errMsg == null) errMsg = new StringBuilder();
                    errMsg.append(file.getOriginalName()).append("의 기록된 이전 파일이 존재하지 않습니다. ");
                    continue;
                }

                if(prevFile.getCommit().getPrId() == null) {
                    prevFile.setIsLatest(true);
                    continue;
                }

                // 3. 이전 파일의 PR 승인 여부 상태 확인
                Pr pr = prRepository.findById(prevFile.getCommit().getPrId())
                        .orElse(null);
                if(pr == null) {
                    if(errMsg == null) errMsg = new StringBuilder();
                    errMsg.append(file.getOriginalName()).append("의 기록된 이전 파일을 저장한 PR이 존재하지 않습니다. ");
                    continue;
                }

                // 4. 이전 파일이 승인 되어 있으면 최신 파일 상태로 바꾸고 종료
                // 5. 이전 파일이 거부 되어 있으면 체크해야하는 파일 목록에 추가 (체크되기 위해서 최신 상태를 true 로 임시 바꿈)
                prevFile.setIsLatest(true);

                if(pr.getState().equals(PrState.DENIED)) {
                    files.add(prevFile);
                }
            }
        }

        return errMsg;
    }
}
