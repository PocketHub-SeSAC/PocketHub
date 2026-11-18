package com.pockethub.team.repository;

import com.pockethub.team.domain.Collaborator;
import com.pockethub.team.domain.Repo;
import com.pockethub.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CollaboratorRepository extends JpaRepository<Collaborator, Long>{

    List<Collaborator> findAllByRepo(Repo repo);

    List<Collaborator> findAllByUser(User user);

    boolean existsByRepoAndUser(Repo repo, User user);

    Optional<Collaborator> findByRepoAndUser(Repo repo, User user);


    long countByRepo(Repo repo);   // 이 팀의 팀원 수

    boolean existsByRepoIdAndUserId(Long repoId, Long userId);

}
