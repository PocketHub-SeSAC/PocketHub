package com.pockethub.user.dto;

import com.pockethub.common.validation.ValidationRules;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SignupRequest {

    @NotBlank(message = "이메일을 입력해주세요")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    @Size(max = ValidationRules.EMAIL_MAX, message = "이메일은 255자 이하로 입력해주세요")
    private String email;

    @NotBlank(message = "비밀번호를 입력해주세요")
    @Size(min = ValidationRules.PASSWORD_MIN, max = ValidationRules.PASSWORD_MAX, message = "비밀번호는 8~64자로 입력해주세요")
    @Pattern(regexp = ValidationRules.PASSWORD_PATTERN, message = "비밀번호는 영문과 숫자를 모두 포함해야 하며, 공백은 사용할 수 없습니다")
    private String password;

    @NotBlank(message = "닉네임을 입력해주세요")
    @Size(min = ValidationRules.NICKNAME_MIN, max = ValidationRules.NICKNAME_MAX, message = "닉네임은 2~45자로 입력해주세요")
    @Pattern(regexp = ValidationRules.NICKNAME_PATTERN, message = "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다")
    private String nickname;
}
