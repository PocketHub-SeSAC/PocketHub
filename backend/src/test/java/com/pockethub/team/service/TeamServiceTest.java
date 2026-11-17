package com.pockethub.team.service;

import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.file.service.FileService;
import com.pockethub.team.domain.Collaborator;
import com.pockethub.team.domain.Repo;
import com.pockethub.team.dto.AddMemberRequest;
import com.pockethub.team.dto.CreateTeamRequest;
import com.pockethub.team.dto.TeamResponse;
import com.pockethub.team.dto.UpdateTeamRequest;
import com.pockethub.team.repository.CollaboratorRepository;
import com.pockethub.team.repository.RepoRepository;
import com.pockethub.user.domain.User;
import com.pockethub.user.repository.UserRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    private static final long OWNER_ID = 1L;
    private static final long OTHER_USER_ID = 2L;
    private static final long TEAM_ID = 10L;

    @Mock
    private RepoRepository repoRepository;
    @Mock
    private CollaboratorRepository collaboratorRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FileService fileService;
    @InjectMocks
    private TeamService teamService;

    @Nested
    @DisplayName("팀 생성")
    class Create {

        @Test
        @DisplayName("팀을 만들면 저장되고, 만든 사람도 팀원으로 등록된다")
        void success() {
            User owner = user(OWNER_ID, "owner@test.com", "철수");
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(owner));
            when(repoRepository.existsByName("백엔드팀")).thenReturn(false);
            when(repoRepository.save(any(Repo.class))).thenAnswer(inv -> withId(inv.getArgument(0), TEAM_ID));

            TeamResponse response = teamService.createTeam(OWNER_ID, createRequest("백엔드팀", "설명"));

            assertThat(response.getTeamId()).isEqualTo(TEAM_ID);
            assertThat(response.getName()).isEqualTo("백엔드팀");
            assertThat(response.getOwnerId()).isEqualTo(OWNER_ID);
            verify(collaboratorRepository).save(any(Collaborator.class));
        }

        @Test
        @DisplayName("이미 있는 팀 이름이면 409")
        void duplicateName() {
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(user(OWNER_ID, "owner@test.com", "철수")));
            when(repoRepository.existsByName("백엔드팀")).thenReturn(true);

            assertThatThrownBy(() -> teamService.createTeam(OWNER_ID, createRequest("백엔드팀", "설명")))
                    .isInstanceOf(ConflictException.class);
            verify(repoRepository, never()).save(any());
        }

        @Test
        @DisplayName("팀 이름이 비어 있으면 400")
        void blankName() {
            assertThatThrownBy(() -> teamService.createTeam(OWNER_ID, createRequest("  ", "설명")))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("팀 목록 조회")
    class GetTeams {

        @Test
        @DisplayName("내가 속한 팀만 조회된다")
        void onlyMyTeams() {
            User me = user(OWNER_ID, "owner@test.com", "철수");
            Repo myTeam = repo(TEAM_ID, "내 팀", me);
            when(userRepository.findById(OWNER_ID)).thenReturn(Optional.of(me));
            when(collaboratorRepository.findAllByUser(me)).thenReturn(List.of(new Collaborator(me, myTeam)));

            List<TeamResponse> teams = teamService.getTeams(OWNER_ID);

            assertThat(teams).hasSize(1);
            assertThat(teams.get(0).getName()).isEqualTo("내 팀");
        }
    }

    @Nested
    @DisplayName("팀 상세 조회")
    class GetTeam {

        @Test
        @DisplayName("없는 팀이면 404")
        void notFound() {
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> teamService.getTeam(TEAM_ID))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("팀 수정")
    class Update {

        @Test
        @DisplayName("팀장이 수정하면 이름이 바뀐다")
        void success() {
            Repo team = repo(TEAM_ID, "백엔드팀", user(OWNER_ID, "owner@test.com", "철수"));
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(repoRepository.existsByName("새이름")).thenReturn(false);

            TeamResponse response = teamService.updateTeam(OWNER_ID, TEAM_ID, updateRequest("새이름", null));

            assertThat(response.getName()).isEqualTo("새이름");
            assertThat(response.getDescription()).isEqualTo("설명");   // 안 보낸 값은 그대로
        }

        @Test
        @DisplayName("팀장이 아니면 403")
        void notOwner() {
            Repo team = repo(TEAM_ID, "백엔드팀", user(OWNER_ID, "owner@test.com", "철수"));
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.updateTeam(OTHER_USER_ID, TEAM_ID, updateRequest("새이름", null)))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("팀 삭제")
    class Delete {

        @Test
        @DisplayName("팀장이 삭제하면 삭제된다")
        void success() {
            Repo team = repo(TEAM_ID, "백엔드팀", user(OWNER_ID, "owner@test.com", "철수"));
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));

            teamService.deleteTeam(OWNER_ID, TEAM_ID);

            verify(repoRepository).delete(team);
        }

        @Test
        @DisplayName("팀장이 아니면 403, 삭제되지 않는다")
        void notOwner() {
            Repo team = repo(TEAM_ID, "백엔드팀", user(OWNER_ID, "owner@test.com", "철수"));
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.deleteTeam(OTHER_USER_ID, TEAM_ID))
                    .isInstanceOf(ForbiddenException.class);
            verify(repoRepository, never()).delete(any());
        }
    }

    @Nested
    @DisplayName("팀원 추가·삭제")
    class Members {

        @Test
        @DisplayName("이미 팀원이면 409")
        void alreadyMember() {
            User owner = user(OWNER_ID, "owner@test.com", "철수");
            User other = user(OTHER_USER_ID, "other@test.com", "영희");
            Repo team = repo(TEAM_ID, "백엔드팀", owner);
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));
            when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(other));
            when(collaboratorRepository.existsByRepoAndUser(team, other)).thenReturn(true);

            assertThatThrownBy(() -> teamService.addMember(OWNER_ID, TEAM_ID, addMemberRequest("other@test.com")))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("팀장은 팀에서 삭제할 수 없다")
        void cannotRemoveOwner() {
            Repo team = repo(TEAM_ID, "백엔드팀", user(OWNER_ID, "owner@test.com", "철수"));
            when(repoRepository.findById(TEAM_ID)).thenReturn(Optional.of(team));

            assertThatThrownBy(() -> teamService.removeMember(OWNER_ID, TEAM_ID, OWNER_ID))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ===== 테스트용 데이터 만들기 =====

    private static User user(long id, String email, String nickname) {
        User user = new User(email, "password", nickname);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Repo repo(long id, String name, User owner) {
        return withId(new Repo(name, "설명", owner), id);
    }

    private static Repo withId(Repo repo, long id) {
        ReflectionTestUtils.setField(repo, "id", id);
        return repo;
    }

    private static CreateTeamRequest createRequest(String name, String description) {
        CreateTeamRequest request = new CreateTeamRequest();
        ReflectionTestUtils.setField(request, "name", name);
        ReflectionTestUtils.setField(request, "description", description);
        return request;
    }

    private static UpdateTeamRequest updateRequest(String name, String description) {
        UpdateTeamRequest request = new UpdateTeamRequest();
        ReflectionTestUtils.setField(request, "name", name);
        ReflectionTestUtils.setField(request, "description", description);
        return request;
    }

    private static AddMemberRequest addMemberRequest(String email) {
        AddMemberRequest request = new AddMemberRequest();
        ReflectionTestUtils.setField(request, "keyword", email);
        return request;
    }
}
