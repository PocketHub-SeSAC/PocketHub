package com.pockethub.pr.repository;

import com.pockethub.commit.domain.Commit;
import com.pockethub.file.domain.File;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PrRepository extends JpaRepository<Pr, Long> {

    // 팀별 목록 (최신순)
    List<Pr> findByRepoIdOrderByPrIdDesc(long repoId);

    List<Pr> findByRepoIdAndStateOrderByPrIdDesc(long repoId, PrState state);

    // 다른 팀 PR 은 없는 PR 과 같게 처리하려고 repoId 까지 같이 찾는다
    Optional<Pr> findByPrIdAndRepoId(long prId, long repoId);

    // ---- 다른 도메인 조회: 해당 담당 파일(CommitRepository 등)을 수정하지 않으려고 여기서 조회 ----

    // PR 에 묶인 커밋
    @Query("select c from Commit c where c.prId = :prId order by c.createdAt")
    List<Commit> findCommitsByPrId(@Param("prId") long prId);

    // 커밋들에 포함된 파일
    @Query("select f from File f where f.commit.commitId in :commitIds order by f.fileId")
    List<File> findFilesByCommitIds(@Param("commitIds") Collection<String> commitIds);

    // TODO : User 엔티티가 생기면 연관관계로 변경
    @Query(value = "select user_id as userId, email, nickname, icon from `user` where user_id in (:userIds)",
            nativeQuery = true)
    List<MemberRow> findMembers(@Param("userIds") Collection<Long> userIds);

    // TODO : Task 엔티티가 생기면 연관관계로 변경
    @Query(value = "select task_id as taskId, title, status from task where task_id in (:taskIds)",
            nativeQuery = true)
    List<TaskRow> findTasks(@Param("taskIds") Collection<Long> taskIds);

    // TODO : Review 엔티티가 생기면 ReviewRepository 로 이동
    @Query(value = "select pr_id as prId, count(*) as reviewCount from review where pr_id in (:prIds) group by pr_id",
            nativeQuery = true)
    List<ReviewCountRow> countReviews(@Param("prIds") Collection<Long> prIds);

    interface MemberRow {
        Long getUserId();
        String getEmail();
        String getNickname();
        String getIcon();
    }

    interface TaskRow {
        Long getTaskId();
        String getTitle();
        String getStatus();
    }

    interface ReviewCountRow {
        Long getPrId();
        Long getReviewCount();
    }
}
