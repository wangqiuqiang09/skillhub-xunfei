package com.iflytek.skillhub.auth.local;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Validates local-account passwords against the platform's length rules.
 */
@Component
public class PasswordPolicyValidator {

    private static final int MIN_LENGTH = 6;
    private static final int MAX_LENGTH = 128;

    public List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null || password.length() < MIN_LENGTH) {
            errors.add("error.auth.local.password.tooShort");
            return errors;
        }
        if (password.length() > MAX_LENGTH) {
            errors.add("error.auth.local.password.tooLong");
            return errors;
        }

        return errors;
    }
}
