package com.pockethub.file.repository;

import com.pockethub.file.domain.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FileRepository extends JpaRepository<File, Long> {
    File findFirstByOriginalNameAndIsLatestOrderByFileIdDesc(String originalName, boolean isLatest);

    @Query("SELECT f FROM File f WHERE f.repoId = :repoId AND f.isLatest = true AND f.state != 'DELETE'" +
            "ORDER BY f.fileId DESC")
    List<File> searchLatestFiles(@Param("repoId") long repoId);
}
