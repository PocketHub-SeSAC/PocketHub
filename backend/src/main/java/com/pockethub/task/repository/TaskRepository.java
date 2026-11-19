package com.pockethub.task.repository;

import com.pockethub.task.domain.Task;
import com.pockethub.task.domain.TaskStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.pockethub.pr.domain.Pr;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByRepoIdOrderByTaskIdDesc(Long repoId);

    List<Task> findByRepoIdAndStatusOrderByTaskIdDesc(Long repoId, TaskStatus status);

    Optional<Task> findByTaskIdAndRepoId(Long taskId, Long repoId);

    // TODO : 팀(Repo·Collaborator) 엔티티가 dev 에 들어오면 팀 쪽 리포지토리로 옮긴다
    @Query(value = "SELECT COUNT(*) FROM repository WHERE repo_id = :repoId", nativeQuery = true)
    long countTeam(@Param("repoId") long repoId);

    // 팀원 = collaborator 에 등록된 회원 + 저장소 소유자
    @Query(value = "SELECT (SELECT COUNT(*) FROM collaborator WHERE repo_id = :repoId AND user_id = :userId)"
            + " + (SELECT COUNT(*) FROM repository WHERE repo_id = :repoId AND user_id = :userId)",
            nativeQuery = true)
    long countMember(@Param("repoId") long repoId, @Param("userId") long userId);

    // Task에 연결된 PR (최신순). TODO: PR 조회는 PrRepository 쪽으로 옮길 수 있음 (지금은 PR 담당 파일을 수정하지 않으려고 여기서 조회)
    @Query("select p from Pr p where p.repoId = :repoId and p.taskId = :taskId order by p.prId desc")
    List<Pr> findPrsByTask(@Param("repoId") long repoId, @Param("taskId") long taskId);
}
