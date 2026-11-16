package com.pockethub.commit.repository;

import com.pockethub.commit.domain.Commit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommitRepository extends JpaRepository<Commit, String> {
    Page<Commit> findByRepoId(long repoId, Pageable pageable);

    Commit findByCommitIdAndRepoId(String commitId, long repoId);
}
