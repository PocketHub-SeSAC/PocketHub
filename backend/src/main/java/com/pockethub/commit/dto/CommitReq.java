package com.pockethub.commit.dto;

import com.pockethub.file.dto.FileReq;

import java.util.List;

public class CommitReq {
    private String commitMessage;
    private List<FileReq> files;
}
