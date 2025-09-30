package com.sulabh.sulabh_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

        @Override
        public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve static files from React build
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(31536000);
    }

        @Override
        public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Forward all non-API routes to index.html for React Router
        registry.addViewController("/{spring:\\w+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/**/{spring:\\w+}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{spring:\\w+}/**{spring:?!(\\.js|\\.css|\\.png|\\.jpg|\\.jpeg|\\.gif|\\.svg|\\.ico)$}")
                .setViewName("forward:/index.html");
    }
}
