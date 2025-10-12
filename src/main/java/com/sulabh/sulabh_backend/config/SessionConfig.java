package com.sulabh.sulabh_backend.config;

import org.springframework.context.annotation.Configuration;

@Configuration
//@EnableSpringHttpSession  // Temporarily disabled
public class SessionConfig {

    // Temporarily disabled until we add proper Spring Session dependencies
    /*
    @Bean
    public HttpSessionIdResolver httpSessionIdResolver() {
        CookieHttpSessionIdResolver resolver = new CookieHttpSessionIdResolver();
        DefaultCookieSerializer cookieSerializer = new DefaultCookieSerializer();
        
        // Configure secure cookie settings
        cookieSerializer.setCookieName("SULABH_SESSION");
        cookieSerializer.setHttpOnly(true);
        cookieSerializer.setSecure(false); // Set to false for development
        cookieSerializer.setSameSite("Lax");
        cookieSerializer.setCookiePath("/");
        cookieSerializer.setCookieMaxAge(15 * 60); // 15 minutes default
        
        resolver.setCookieSerializer(cookieSerializer);
        return resolver;
    }
    */
}