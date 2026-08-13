package com.travel.api.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class UserPrincipal {
    private final String supabaseUserId;
    private final String userName;
    private final String email;
}
