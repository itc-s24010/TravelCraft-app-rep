package com.travel.api.service;

import com.travel.api.entity.User;
import com.travel.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User ensureUser(String supabaseUserId) {
        return userRepository.findBySupabaseUserId(supabaseUserId)
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .supabaseUserId(supabaseUserId)
                                .build()
                ));
    }
}
