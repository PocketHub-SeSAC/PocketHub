package com.pockethub.user.service;

import com.pockethub.common.exception.ConflictException;
import com.pockethub.user.domain.User;
import com.pockethub.user.dto.SignupRequest;
import com.pockethub.user.dto.UserResponse;
import com.pockethub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // 회원가입 로직
    @Transactional
    public UserResponse signup(SignupRequest signupRequest) {
        // 이메일 중복 검증
        if(userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new ConflictException("이미 가입된 이메일입니다");
        }

        // 닉네임 중복 검증
        if(userRepository.existsByNickname(signupRequest.getNickname())) {
            throw new ConflictException("이미 사용 중인 닉네임입니다");
        }

        // 비밀번호 해싱
        String encodePw = passwordEncoder.encode(signupRequest.getPassword());

        User user = userRepository.save(
                new User(
                        signupRequest.getEmail(),
                        encodePw,
                        signupRequest.getNickname()
                )
        );

        return UserResponse.from(user);
    }
}
