package com.pockethub.pr.repository;

import com.pockethub.commit.domain.Commit;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PrRepository extends JpaRepository<Pr, Long> {

    // 팀별 목록 (최신순)
    List<Pr> findByRepoIdOrderByPrIdDesc(long repoId);

    List<Pr> findByRepoIdAndStateOrderByPrIdDesc(long repoId, PrState state);

    // 다른 팀 PR 은 없는 PR 과 같게 처리하려고 repoId 까지 같이 찾는다
    Optional<Pr> findByPrIdAndRepoId(long prId, long repoId);

    // PR 에 묶인 커밋. CommitRepository 는 파일 담당 코드라 수정하지 않고 여기서 조회
    @Query("select c from Commit c where c.prId = :prId order by c.createdAt")
    List<Commit> findCommitsByPrId(@Param("prId") long prId);
}
