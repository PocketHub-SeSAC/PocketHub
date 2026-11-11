package com.pockethub;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.pockethub.common.validation.ValidationRules;
import org.junit.jupiter.api.Test;

/** DB 없이 도는 테스트만 둔다 (컨텍스트 로딩 테스트는 MySQL 이 필요해서 넣지 않음) */
class ValidationRulesTest {

    @Test
    void passwordRange() {
        assertTrue(ValidationRules.PASSWORD_MIN <= ValidationRules.PASSWORD_MAX);
    }
}
