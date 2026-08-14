package com.iflytek.skillhub.auth.local;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configures email domains accepted by first-party local registration.
 */
@Component
@ConfigurationProperties(prefix = "skillhub.auth.local.registration")
public class LocalRegistrationProperties {

    private List<String> allowedEmailSuffixes = List.of("x-sense.com");

    public List<String> getAllowedEmailSuffixes() {
        return allowedEmailSuffixes;
    }

    public void setAllowedEmailSuffixes(List<String> allowedEmailSuffixes) {
        if (allowedEmailSuffixes == null) {
            this.allowedEmailSuffixes = List.of();
            return;
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String suffix : allowedEmailSuffixes) {
            if (suffix == null) {
                continue;
            }
            String value = suffix.trim().toLowerCase(Locale.ROOT);
            if ("*".equals(value)) {
                this.allowedEmailSuffixes = List.of();
                return;
            }
            while (value.startsWith("@")) {
                value = value.substring(1);
            }
            if (!value.isBlank()) {
                normalized.add(value);
            }
        }
        this.allowedEmailSuffixes = List.copyOf(normalized);
    }
}
