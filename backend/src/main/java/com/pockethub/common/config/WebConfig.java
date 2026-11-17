package com.pockethub.common.config;

import com.pockethub.common.auth.TeamAccessInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private static final String TEAM_API_PATTERN = "/api/v1/teams/**";

    private final TeamAccessInterceptor teamAccessInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(teamAccessInterceptor)
                .addPathPatterns(TEAM_API_PATTERN);
    }
}