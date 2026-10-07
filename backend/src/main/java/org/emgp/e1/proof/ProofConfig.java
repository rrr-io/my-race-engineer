package org.emgp.e1.proof;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ProofConfig {

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
