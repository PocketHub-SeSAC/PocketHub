package com.pockethub.file.dto;

import lombok.Getter;
import lombok.Setter;

import java.io.File;

@Getter
@Setter
public class FileDownloadRes {
    private String fileName;
    private String mediaType;
    private String fileLength;
    private File file;

    public FileDownloadRes() { }

    public FileDownloadRes(String fileName, String mediaType, String fileLength, File file) {
        this.fileName = fileName;
        this.mediaType = mediaType;
        this.fileLength = fileLength;
        this.file = file;
    }
}
