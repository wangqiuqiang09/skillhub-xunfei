package com.iflytek.skillhub.auth.local;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class LocalRegistrationPropertiesTest {

    @Test
    void defaultsToXSenseDomain() {
        LocalRegistrationProperties properties = new LocalRegistrationProperties();

        assertThat(properties.getAllowedEmailSuffixes()).containsExactly("x-sense.com");
    }

    @Test
    void normalizesConfiguredSuffixes() {
        LocalRegistrationProperties properties = new LocalRegistrationProperties();

        properties.setAllowedEmailSuffixes(List.of(" @X-SENSE.COM ", "example.org", "example.org"));

        assertThat(properties.getAllowedEmailSuffixes()).containsExactly("x-sense.com", "example.org");
    }

    @Test
    void emptyConfigurationDisablesSuffixRestriction() {
        LocalRegistrationProperties properties = new LocalRegistrationProperties();

        properties.setAllowedEmailSuffixes(List.of());

        assertThat(properties.getAllowedEmailSuffixes()).isEmpty();
    }

    @Test
    void wildcardDisablesSuffixRestriction() {
        LocalRegistrationProperties properties = new LocalRegistrationProperties();

        properties.setAllowedEmailSuffixes(List.of("*"));

        assertThat(properties.getAllowedEmailSuffixes()).isEmpty();
    }
}
