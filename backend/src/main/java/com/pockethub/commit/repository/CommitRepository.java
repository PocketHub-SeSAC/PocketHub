package com.pockethub.commit.repository;

import com.pockethub.commit.domain.Commit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommitRepository extends JpaRepository<Commit, String> {
}
