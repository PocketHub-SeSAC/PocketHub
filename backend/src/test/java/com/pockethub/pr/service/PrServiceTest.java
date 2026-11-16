package com.pockethub.pr.service;

import com.pockethub.commit.domain.Commit;
import com.pockethub.commit.dto.FileState;
import com.pockethub.commit.repository.CommitRepository;
import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.file.domain.File;
import com.pockethub.pr.domain.Pr;
import com.pockethub.pr.domain.PrState;
import com.pockethub.pr.dto.PrCreateRequest;
import com.pockethub.pr.dto.PrDetailResponse;
import com.pockethub.pr.dto.PrSummaryResponse;
import com.pockethub.pr.dto.PrUpdateRequest;
import com.pockethub.pr.repository.PrRepository;
import com.pockethub.pr.repository.PrRepository.MemberRow;
import com.pockethub.pr.repository.PrRepository.ReviewCountRow;
import com.pockethub.pr.repository.PrRepository.TaskRow;
import com.pockethub.task.domain.Task;
import com.pockethub.task.domain.TaskPriority;
import com.pockethub.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrServiceTest {

    private static final long REPO_ID = 1L;
    private static final long OTHER_REPO_ID = 2L;
    private static final long AUTHOR_ID = 1L;
    private static final long OTHER_USER_ID = 2L;
    private static final long TASK_ID = 7L;
    private static final long PR_ID = 10L;

    @Mock
    private PrRepository prRepository;
    @Mock
    private CommitRepository commitRepository;
    @Mock
    private TaskRepository taskRepository;
    @InjectMocks
    private PrService prService;

    // 작성자·Task·리뷰 수 조회는 모든 응답에서 쓰므로 기본값으로 깔아 둔다
    @BeforeEach
    void stubRelated() {
        lenient().when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(taskEntity(REPO_ID)));
        lenient().when(prRepository.findMembers(anyCollection())).thenReturn(List.of(
                member(AUTHOR_ID, "새싹"), member(OTHER_USER_ID, "달팽이")));
        lenient().when(prRepository.findTasks(anyCollection())).thenReturn(List.of(task(TASK_ID, "로그인 화면", "DOING")));
        lenient().when(prRepository.countReviews(anyCollection())).thenReturn(List.of());
        lenient().when(prRepository.findFilesByCommitIds(anyCollection())).thenReturn(List.of());
    }

    @Nested
    @DisplayName("PR 생성")
    class Create {

        @Test
        @DisplayName("내 커밋으로 만들면 OPEN 상태로 저장되고 커밋에 PR 번호가 연결된다")
        void success() {
            Commit commit = commit("c1", REPO_ID, AUTHOR_ID);
            when(commitRepository.findAllById(List.of("c1"))).thenReturn(List.of(commit));
            when(prRepository.save(any(Pr.class))).thenAnswer(inv -> withId(inv.getArgument(0), PR_ID));

            PrDetailResponse response = prService.createPr(AUTHOR_ID, REPO_ID, createRequest("  새 PR  ", List.of("c1")));

            assertThat(response.getPrId()).isEqualTo(PR_ID);
            assertThat(response.getTitle()).isEqualTo("새 PR");
            assertThat(response.getStatus()).isEqualTo("OPEN");
            assertThat(response.getAuthor().nickname()).isEqualTo("새싹");
            assertThat(response.getTask().title()).isEqualTo("로그인 화면");
            assertThat(response.getCommits()).extracting(PrDetailResponse.CommitItem::commitId).containsExactly("c1");
            assertThat(commit.getPrId()).isEqualTo(PR_ID);
        }

        @Test
        @DisplayName("제목이 비어 있으면 400")
        void blankTitle() {
            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest(" ", List.of("c1"))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("PR 제목을 입력해 주세요.");
            verify(prRepository, never()).save(any());
        }

        @Test
        @DisplayName("제목이 100자를 넘으면 400")
        void tooLongTitle() {
            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("가".repeat(101), List.of("c1"))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("100자 이하");
        }

        @Test
        @DisplayName("커밋을 고르지 않으면 400")
        void noCommits() {
            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of())))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("포함할 커밋을 1개 이상 골라 주세요.");
        }

        @Test
        @DisplayName("Task 를 고르지 않으면 400")
        void noTask() {
            PrCreateRequest request = createRequest("PR", List.of("c1"));
            request.setTaskId(null);

            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("연결할 Task를 골라 주세요.");
        }

        @Test
        @DisplayName("없는 Task 면 404, 저장하지 않는다")
        void taskNotFound() {
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.empty());

            assertError(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of("c1"))),
                    NotFoundException.class, "Task를 찾을 수 없습니다.");
            verify(prRepository, never()).save(any());
        }

        @Test
        @DisplayName("다른 팀 Task 는 없는 Task 와 같은 404")
        void otherTeamTask() {
            when(taskRepository.findById(TASK_ID)).thenReturn(Optional.of(taskEntity(OTHER_REPO_ID)));

            assertError(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of("c1"))),
                    NotFoundException.class, "Task를 찾을 수 없습니다.");
            verify(prRepository, never()).save(any());
        }

        @Test
        @DisplayName("다른 팀 커밋은 없는 커밋과 같은 400")
        void otherTeamCommit() {
            when(commitRepository.findAllById(List.of("c1"))).thenReturn(List.of(commit("c1", OTHER_REPO_ID, AUTHOR_ID)));

            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of("c1"))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("찾을 수 없는 커밋");
            verify(prRepository, never()).save(any());
        }

        @Test
        @DisplayName("다른 사람 커밋은 400")
        void othersCommit() {
            when(commitRepository.findAllById(List.of("c1"))).thenReturn(List.of(commit("c1", REPO_ID, OTHER_USER_ID)));

            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of("c1"))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("내가 만든 커밋만 PR에 넣을 수 있어요.");
        }

        @Test
        @DisplayName("이미 다른 PR 에 묶인 커밋은 400")
        void alreadyLinkedCommit() {
            Commit linked = commit("c1", REPO_ID, AUTHOR_ID);
            linked.setPrId(99L);
            when(commitRepository.findAllById(List.of("c1"))).thenReturn(List.of(linked));

            assertThatThrownBy(() -> prService.createPr(AUTHOR_ID, REPO_ID, createRequest("PR", List.of("c1"))))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("이미 다른 PR에 연결돼 있어요");
            assertThat(linked.getPrId()).isEqualTo(99L);
        }
    }

    @Nested
    @DisplayName("PR 목록·상세 조회")
    class Read {

        @Test
        @DisplayName("상태 없이 조회하면 팀 전체 목록을 작성자·Task·리뷰 수와 함께 준다")
        void listAll() {
            when(prRepository.findByRepoIdOrderByPrIdDesc(REPO_ID)).thenReturn(List.of(pr(PR_ID, AUTHOR_ID)));
            when(prRepository.countReviews(anyCollection())).thenReturn(List.of(reviewCount(PR_ID, 3L)));

            List<PrSummaryResponse> result = prService.getPrs(REPO_ID, null);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAuthor().nickname()).isEqualTo("새싹");
            assertThat(result.get(0).getTask().status()).isEqualTo("DOING");
            assertThat(result.get(0).getReviewCount()).isEqualTo(3L);
            assertThat(result.get(0).getDecidedBy()).isNull();
        }

        @Test
        @DisplayName("프론트 상태 값(WAITING)도 OPEN 으로 필터한다")
        void listByFrontStatus() {
            when(prRepository.findByRepoIdAndStateOrderByPrIdDesc(REPO_ID, PrState.OPEN)).thenReturn(List.of());

            assertThat(prService.getPrs(REPO_ID, "waiting")).isEmpty();
            verify(prRepository).findByRepoIdAndStateOrderByPrIdDesc(REPO_ID, PrState.OPEN);
        }

        @Test
        @DisplayName("PR 이 없으면 작성자 등 추가 조회를 하지 않는다")
        void emptyListSkipsLookups() {
            when(prRepository.findByRepoIdOrderByPrIdDesc(REPO_ID)).thenReturn(List.of());

            assertThat(prService.getPrs(REPO_ID, "")).isEmpty();
            verify(prRepository, never()).findMembers(anyCollection());
        }

        @Test
        @DisplayName("모르는 상태 값이면 400")
        void invalidStatus() {
            assertThatThrownBy(() -> prService.getPrs(REPO_ID, "FOO"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("상세는 설명·커밋·파일 목록과 커밋별 파일 수를 준다")
        void detail() {
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr(PR_ID, AUTHOR_ID)));
            when(prRepository.findCommitsByPrId(PR_ID)).thenReturn(List.of(commit("c1", REPO_ID, AUTHOR_ID)));
            when(prRepository.findFilesByCommitIds(List.of("c1"))).thenReturn(List.of(
                    file("c1", "a.txt", FileState.ADD), file("c1", "b.txt", FileState.UPDATE)));

            PrDetailResponse response = prService.getPr(REPO_ID, PR_ID);

            assertThat(response.getDescription()).isEqualTo("설명");
            assertThat(response.getCommits()).singleElement()
                    .extracting(PrDetailResponse.CommitItem::fileCount).isEqualTo(2L);
            assertThat(response.getFiles()).extracting(PrDetailResponse.FileItem::name, PrDetailResponse.FileItem::action)
                    .containsExactly(
                            org.assertj.core.groups.Tuple.tuple("a.txt", "ADD"),
                            org.assertj.core.groups.Tuple.tuple("b.txt", "UPDATE"));
        }

        @Test
        @DisplayName("없는 PR·다른 팀 PR 은 404")
        void notFound() {
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.empty());

            assertError(() -> prService.getPr(REPO_ID, PR_ID), NotFoundException.class, "PR을 찾을 수 없습니다.");
        }

        @Test
        @DisplayName("작성자 회원 정보가 없으면 ID 만 준다")
        void unknownAuthor() {
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr(PR_ID, 99L)));
            when(prRepository.findCommitsByPrId(PR_ID)).thenReturn(List.of());

            PrDetailResponse response = prService.getPr(REPO_ID, PR_ID);

            assertThat(response.getAuthor().userId()).isEqualTo(99L);
            assertThat(response.getAuthor().nickname()).isNull();
        }
    }

    @Nested
    @DisplayName("PR 수정")
    class Update {

        @Test
        @DisplayName("작성자는 OPEN 상태의 제목·설명을 고칠 수 있다")
        void success() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));
            when(prRepository.findCommitsByPrId(PR_ID)).thenReturn(List.of());

            PrDetailResponse response = prService.updatePr(AUTHOR_ID, REPO_ID, PR_ID, updateRequest("고친 제목", "고친 설명"));

            assertThat(pr.getTitle()).isEqualTo("고친 제목");
            assertThat(response.getDescription()).isEqualTo("고친 설명");
        }

        @Test
        @DisplayName("작성자가 아니면 403")
        void notAuthor() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));

            assertError(() -> prService.updatePr(OTHER_USER_ID, REPO_ID, PR_ID, updateRequest("x", null)),
                    ForbiddenException.class, "내가 작성한 PR만 수정할 수 있어요.");
            assertThat(pr.getTitle()).isEqualTo("PR");
        }

        @Test
        @DisplayName("이미 처리된 PR 은 409 (작성자 검사보다 먼저)")
        void alreadyDecided() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            ReflectionTestUtils.setField(pr, "state", PrState.APPROVE);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));

            assertError(() -> prService.updatePr(OTHER_USER_ID, REPO_ID, PR_ID, updateRequest("x", null)),
                    ConflictException.class, "이미 처리된 PR은 수정할 수 없어요.");
        }

        @Test
        @DisplayName("제목을 비우면 400")
        void blankTitle() {
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr(PR_ID, AUTHOR_ID)));

            assertThatThrownBy(() -> prService.updatePr(AUTHOR_ID, REPO_ID, PR_ID, updateRequest("  ", null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("PR 제목을 입력해 주세요.");
        }
    }

    @Nested
    @DisplayName("PR 삭제")
    class Delete {

        @Test
        @DisplayName("작성자가 지우면 묶였던 커밋이 풀리고 PR 이 삭제된다")
        void success() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            Commit commit = commit("c1", REPO_ID, AUTHOR_ID);
            commit.setPrId(PR_ID);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));
            when(prRepository.findCommitsByPrId(PR_ID)).thenReturn(List.of(commit));

            prService.deletePr(AUTHOR_ID, REPO_ID, PR_ID);

            assertThat(commit.getPrId()).isNull();
            verify(prRepository).delete(pr);
        }

        @Test
        @DisplayName("작성자가 아니면 403, 삭제하지 않는다")
        void notAuthor() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));

            assertError(() -> prService.deletePr(OTHER_USER_ID, REPO_ID, PR_ID),
                    ForbiddenException.class, "내가 작성한 PR만 삭제할 수 있어요.");
            verify(prRepository, never()).delete(any());
        }

        @Test
        @DisplayName("이미 처리된 PR 은 409")
        void alreadyDecided() {
            Pr pr = pr(PR_ID, AUTHOR_ID);
            ReflectionTestUtils.setField(pr, "state", PrState.DENIED);
            when(prRepository.findByPrIdAndRepoId(PR_ID, REPO_ID)).thenReturn(Optional.of(pr));

            assertError(() -> prService.deletePr(AUTHOR_ID, REPO_ID, PR_ID),
                    ConflictException.class, "이미 처리된 PR은 삭제할 수 없어요.");
            verify(prRepository, never()).delete(any());
        }
    }

    // ---------- 테스트 데이터 ----------

    // 예외 종류가 곧 응답 코드 (NotFound 404, Forbidden 403, Conflict 409 — GlobalExceptionHandler)
    private static void assertError(org.assertj.core.api.ThrowableAssert.ThrowingCallable call,
                                    Class<? extends RuntimeException> type, String message) {
        assertThatThrownBy(call).isExactlyInstanceOf(type).hasMessage(message);
    }

    private static Task taskEntity(long repoId) {
        return new Task(repoId, "로그인 화면", "설명", TaskPriority.MEDIUM, null, null);
    }

    private static Pr pr(long prId, long authorId) {
        return withId(new Pr("PR", "설명", REPO_ID, TASK_ID, authorId), prId);
    }

    private static Pr withId(Pr pr, long prId) {
        ReflectionTestUtils.setField(pr, "prId", prId);
        return pr;
    }

    private static Commit commit(String commitId, long repoId, long userId) {
        return new Commit(commitId, repoId, userId, "커밋 " + commitId);
    }

    private static File file(String commitId, String name, FileState state) {
        return new File("/uploads/" + name, name, state, 1.0f, true, REPO_ID, commitId, null);
    }

    private static PrCreateRequest createRequest(String title, List<String> commitIds) {
        PrCreateRequest request = new PrCreateRequest();
        request.setTitle(title);
        request.setDescription("설명");
        request.setCommitIds(commitIds);
        request.setTaskId(TASK_ID);
        return request;
    }

    private static PrUpdateRequest updateRequest(String title, String description) {
        PrUpdateRequest request = new PrUpdateRequest();
        request.setTitle(title);
        request.setDescription(description);
        return request;
    }

    private static MemberRow member(long userId, String nickname) {
        return new MemberRow() {
            public Long getUserId() { return userId; }
            public String getEmail() { return nickname + "@example.com"; }
            public String getNickname() { return nickname; }
            public String getIcon() { return null; }
        };
    }

    private static TaskRow task(long taskId, String title, String status) {
        return new TaskRow() {
            public Long getTaskId() { return taskId; }
            public String getTitle() { return title; }
            public String getStatus() { return status; }
        };
    }

    private static ReviewCountRow reviewCount(long prId, long count) {
        return new ReviewCountRow() {
            public Long getPrId() { return prId; }
            public Long getReviewCount() { return count; }
        };
    }
}
