package com.pockethub.file.repository;

import com.pockethub.file.domain.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, Long> {
    File findFirstByOriginalNameAndIsLatestOrderByFileIdDesc(String originalName, boolean isLatest);
}
