package com.pockethub.team.repository;

import com.pockethub.team.domain.Repo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepoRepository extends JpaRepository<Repo, Long> {

    boolean existsByName(String name);
}
