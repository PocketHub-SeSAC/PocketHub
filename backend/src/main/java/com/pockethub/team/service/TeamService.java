package com.pockethub.team.service;

import com.pockethub.user.domain.User;
import com.pockethub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import com.pockethub.team.domain.Collaborator;
import com.pockethub.team.domain.Repo;
import com.pockethub.team.dto.*;
import com.pockethub.team.repository.CollaboratorRepository;
import com.pockethub.team.repository.RepoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.pockethub.common.exception.ConflictException;
import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 조회 전용
public class TeamService {

    private final RepoRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final UserRepository userRepository;

    // ===== 팀 =====

    @Transactional
    public TeamResponse createTeam(Long loginUserId, CreateTeamRequest request) {

        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("저장소 이름을 입력해주세요.");
        }

        User owner = findUser(loginUserId);

        if (repoRepository.existsByName(request.getName())) {
            throw new ConflictException("이미 사용 중인 팀 이름입니다.");
        }

        Repo repo = repoRepository.save(request.toEntity(owner));
        collaboratorRepository.save(new Collaborator(owner, repo));   // 만든 사람도 팀원으로
        return toResponse(repo);
    }

    public List<TeamResponse> getTeams(Long loginUserId) {
        User user = findUser(loginUserId);
        return collaboratorRepository.findAllByUser(user).stream()
                .map(c -> toResponse(c.getRepo()))
                .toList();
    }

    public TeamResponse getTeam(Long teamId) {
        return toResponse(findRepo(teamId));
    }

    @Transactional
    public TeamResponse updateTeam(Long loginUserId, Long teamId, UpdateTeamRequest request) {
        Repo repo = findRepo(teamId);
        checkOwner(repo, loginUserId);

        if (request.getName() != null && request.getName().isBlank()) {
            throw new IllegalArgumentException("저장소 이름을 입력해주세요.");
        }
        if (request.getName() != null
                && !request.getName().equals(repo.getName())
                && repoRepository.existsByName(request.getName())) {
            throw new ConflictException("이미 사용 중인 팀 이름입니다.");
        }


        repo.update(request.getName(), request.getDescription());   // save 안 해도 자동 반영
        return toResponse(repo);
    }

    @Transactional
    public void deleteTeam(Long loginUserId, Long teamId) {
        Repo repo = findRepo(teamId);
        checkOwner(repo, loginUserId);
        repoRepository.delete(repo);   // 팀원 연결은 DB의 ON DELETE CASCADE로 같이 삭제
    }

    // ===== 팀원 =====

    public List<TeamMemberResponse> getMembers(Long teamId) {
        Repo repo = findRepo(teamId);
        return collaboratorRepository.findAllByRepo(repo).stream()
                .map(TeamMemberResponse::new)
                .toList();
    }

    @Transactional
    public TeamMemberResponse addMember(Long loginUserId, Long teamId, AddMemberRequest request) {
        Repo repo = findRepo(teamId);
        checkOwner(repo, loginUserId);

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("추가할 사용자의 이메일을 입력해주세요.");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (collaboratorRepository.existsByRepoAndUser(repo, user)) {
            throw new ConflictException("이미 팀원입니다.");
        }
        Collaborator saved = collaboratorRepository.save(new Collaborator(user, repo));
        return new TeamMemberResponse(saved);
    }

    @Transactional
    public void removeMember(Long loginUserId, Long teamId, Long userId) {
        Repo repo = findRepo(teamId);
        checkOwner(repo, loginUserId);

        if (repo.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("팀장은 삭제할 수 없습니다.");
        }

        User user = findUser(userId);

        Collaborator collaborator = collaboratorRepository.findByRepoAndUser(repo, user)
                .orElseThrow(() -> new NotFoundException("팀원이 아닙니다."));
        collaboratorRepository.delete(collaborator);
    }

    // ===== 공통으로 쓰는 메서드 =====

    private Repo findRepo(Long teamId) {
        return repoRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("팀을 찾을 수 없습니다."));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("회원을 찾을 수 없습니다."));
    }

    private void checkOwner(Repo repo, Long loginUserId) {
        if (!repo.getOwner().getId().equals(loginUserId)) {
            throw new ForbiddenException("팀장만 할 수 있습니다.");
        }
    }

    private TeamResponse toResponse(Repo repo) {
        return new TeamResponse(repo, collaboratorRepository.countByRepo(repo));
    }

}


