package com.travel.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class DataSourceConfig {

    // Confirmed reachable pooler region for this Supabase project (ap-northeast-1 / Tokyo)
    private static final String POOLER_REGION = "ap-northeast-1";

    @Value("${SUPABASE_JDBC_URL}")
    private String rawJdbcUrl;

    @Value("${SUPABASE_DB_PASSWORD}")
    private String dbPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String jdbcUrl = resolveJdbcUrl(rawJdbcUrl, dbPassword);
        return DataSourceBuilder.create()
                .url(jdbcUrl)
                .driverClassName("org.postgresql.Driver")
                .build();
    }

    /**
     * Rewrites direct Supabase URL (db.{ref}.supabase.co:5432) to Transaction
     * Pooler URL (aws-0-{region}.pooler.supabase.com:6543) because the direct
     * host resolves to IPv6-only and is unreachable from this environment.
     * Always uses SUPABASE_DB_PASSWORD directly to avoid URL-decoding issues.
     */
    private String resolveJdbcUrl(String raw, String password) {
        String url = raw.startsWith("jdbc:") ? raw.substring(5) : raw;

        try {
            URI uri = new URI(url);
            String host = uri.getHost();

            // Detect direct connection: db.{ref}.supabase.co
            if (host != null && host.startsWith("db.") && host.endsWith(".supabase.co")) {
                String ref = host.substring(3, host.length() - ".supabase.co".length());
                return buildPoolerUrl(ref, password);
            }

            // Detect if it's already a pooler URL — just ensure jdbc: prefix
            // but replace password safely using SUPABASE_DB_PASSWORD
            if (host != null && host.contains("pooler.supabase.com")) {
                // Extract ref from userInfo like postgres.bfjpbraseralmrxsvkva
                String ref = extractRefFromPoolerUri(uri);
                if (ref != null) {
                    return buildPoolerUrl(ref, password);
                }
            }

        } catch (Exception e) {
            // Fall through
        }

        // Unknown format: add jdbc: prefix and hope for the best
        return url.startsWith("jdbc:") ? url : "jdbc:" + url;
    }

    private String buildPoolerUrl(String ref, String password) {
        String poolerHost = "aws-0-" + POOLER_REGION + ".pooler.supabase.com";
        String encodedPassword = URLEncoder.encode(password, StandardCharsets.UTF_8);
        // prepareThreshold=0 disables server-side prepared statements,
        // required for Supabase Transaction Pooler (Supavisor in transaction mode)
        return "jdbc:postgresql://" + poolerHost + ":6543/postgres"
                + "?user=postgres." + ref
                + "&password=" + encodedPassword
                + "&sslmode=require"
                + "&prepareThreshold=0";
    }

    private String extractRefFromPoolerUri(URI uri) {
        // UserInfo format: postgres.{ref}:{password} or postgres.{ref}
        String userInfo = uri.getUserInfo();
        if (userInfo != null) {
            String user = userInfo.split(":")[0];
            if (user.startsWith("postgres.")) {
                return user.substring("postgres.".length());
            }
        }
        // Fallback: check query params for user=postgres.{ref}
        String query = uri.getQuery();
        if (query != null) {
            for (String pair : query.split("&")) {
                if (pair.startsWith("user=postgres.")) {
                    return pair.substring("user=postgres.".length());
                }
            }
        }
        return null;
    }
}
