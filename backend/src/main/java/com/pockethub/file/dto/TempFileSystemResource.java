package com.pockethub.file.dto;

import org.springframework.core.io.FileSystemResource;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

// 임시 대용량 파일을 전송 후 삭제하기 위해 FileSystemResource 를 상속받아 구현
public class TempFileSystemResource extends FileSystemResource {
    private final File file;

    public TempFileSystemResource(File file) {
        super(file);
        this.file = file;
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return new FileInputStream(file) {
            @Override
            public void close() throws IOException {
                super.close();
                if(file.exists()) {
                    boolean deleted = file.delete();
                    if(!deleted) {
                        // TODO : 커스텀 익셉션 추가
                        throw new RuntimeException("임시 파일이 삭제되지 않았습니다!");
                    }
                }
            }
        };
    }
}
