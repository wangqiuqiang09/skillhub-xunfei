package com.iflytek.skillhub.auth.local;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class PasswordPolicyValidatorTest {

    private final PasswordPolicyValidator validator = new PasswordPolicyValidator();

    @Test
    void validPassword_passes() {
        assertThat(validator.validate("Abcdef1!")).isEmpty();
    }

    @Test
    void tooShort_fails() {
        assertThat(validator.validate("abcde")).containsExactly("error.auth.local.password.tooShort");
    }

    @Test
    void tooLong_fails() {
        assertThat(validator.validate("A".repeat(129))).containsExactly("error.auth.local.password.tooLong");
    }

    @Test
    void sixCharacterPassword_passes() {
        assertThat(validator.validate("abcdef")).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Abcdefg1", "Abcdef1!", "abcdef1!", "ABCDEF1!"})
    void passwords_with_different_character_types_pass(String password) {
        assertThat(validator.validate(password)).isEmpty();
    }
}
