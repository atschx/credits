package com.credits.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI creditsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Credits System API")
                        .description("Credit consumption system with ASC 606 revenue recognition")
                        .version("v0.1.0"));
    }
}
