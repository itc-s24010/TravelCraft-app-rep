package com.travel.api.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.math.BigInteger;
import java.net.URL;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class FirebaseJwtFilter extends OncePerRequestFilter {

    private static final String JWKS_URL =
            "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

    @Value("${firebase.project-id}")
    private String projectId;

    // Cache: kid -> PublicKey (refreshed lazily)
    private final Map<String, PublicKey> keyCache = new ConcurrentHashMap<>();
    private long keyCacheExpiry = 0;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                // Decode header to get 'kid'
                String[] parts = token.split("\\.");
                String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
                JsonNode header = objectMapper.readTree(headerJson);
                String kid = header.get("kid").asText();

                PublicKey publicKey = getPublicKey(kid);
                if (publicKey == null) {
                    filterChain.doFilter(request, response);
                    return;
                }

                Claims claims = Jwts.parser()
                        .verifyWith(publicKey)
                        .requireIssuer("https://securetoken.google.com/" + projectId)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                // Validate audience
                if (!claims.getAudience().contains(projectId)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String userId = claims.getSubject();
                if (userId != null) {
                    UserPrincipal principal = new UserPrincipal(
                            userId,
                            claims.get("name", String.class),
                            claims.get("email", String.class));
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private PublicKey getPublicKey(String kid) throws Exception {
        // Refresh cache if expired
        if (System.currentTimeMillis() > keyCacheExpiry || !keyCache.containsKey(kid)) {
            refreshKeyCache();
        }
        return keyCache.get(kid);
    }

    private synchronized void refreshKeyCache() throws Exception {
        Map<String, PublicKey> newKeys = new HashMap<>();
        JsonNode jwks = objectMapper.readTree(new URL(JWKS_URL));
        for (JsonNode key : jwks.get("keys")) {
            String keyId = key.get("kid").asText();
            String n = key.get("n").asText();
            String e = key.get("e").asText();

            byte[] modulusBytes = Base64.getUrlDecoder().decode(n);
            byte[] exponentBytes = Base64.getUrlDecoder().decode(e);
            BigInteger modulus = new BigInteger(1, modulusBytes);
            BigInteger exponent = new BigInteger(1, exponentBytes);

            RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            newKeys.put(keyId, factory.generatePublic(spec));
        }
        keyCache.clear();
        keyCache.putAll(newKeys);
        // Cache for 1 hour
        keyCacheExpiry = System.currentTimeMillis() + 3_600_000L;
    }
}
