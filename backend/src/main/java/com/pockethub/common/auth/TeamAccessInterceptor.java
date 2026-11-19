package com.pockethub.common.auth;

import com.pockethub.common.exception.ForbiddenException;
import com.pockethub.common.exception.NotFoundException;
import com.pockethub.team.repository.CollaboratorRepository;
import com.pockethub.team.repository.RepoRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

@Component
@RequiredArgsConstructor
public class TeamAccessInterceptor implements HandlerInterceptor {

    private static final String TEAM_ID_VARIABLE = "teamId";

    private final RepoRepository repoRepository;
    private final CollaboratorRepository collaboratorRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Long teamId = extractTeamId(request);
        if (teamId == null) {
            return true;
        }

        if (!repoRepository.existsById(teamId)) {
            throw new NotFoundException("팀을 찾을 수 없습니다.");
        }
        if (!isMember(teamId, currentUserId())) {
            throw new ForbiddenException("팀원만 접근할 수 있습니다.");
        }
        return true;
    }

    private Long extractTeamId(HttpServletRequest request) {
        Object attribute = request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
        if (!(attribute instanceof Map<?, ?> pathVariables)) {
            return null;
        }
        Object value = pathVariables.get(TEAM_ID_VARIABLE);
        if (value == null) {
            return null;
        }
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean isMember(Long teamId, Long userId) {
        return collaboratorRepository.existsByRepoIdAndUserId(teamId, userId)
                || repoRepository.existsByIdAndOwnerId(teamId, userId);
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return Long.valueOf(authentication.getName());
    }
}