package com.travel.api.service;

import com.travel.api.entity.User;
import com.travel.api.repository.UserRepository;
import com.travel.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User ensureUser(UserPrincipal principal) {
        return userRepository.findBySupabaseUserId(principal.getSupabaseUserId())
                .map(user -> updateProfile(user, principal))
                .orElseGet(() -> userRepository.save(User.builder()
                        .supabaseUserId(principal.getSupabaseUserId())
                        .userName(principal.getUserName())
                        .email(principal.getEmail())
                        .build()));
    }

    private User updateProfile(User user, UserPrincipal principal) {
        boolean changed = false;
        if (principal.getUserName() != null && !principal.getUserName().isBlank()
                && !principal.getUserName().equals(user.getUserName())) {
            user.setUserName(principal.getUserName());
            changed = true;
        }
        if (principal.getEmail() != null && !principal.getEmail().equals(user.getEmail())) {
            user.setEmail(principal.getEmail());
            changed = true;
        }
        return changed ? userRepository.save(user) : user;
    }

    public User updateUserName(UserPrincipal principal, String userName) {
        if (userName == null || userName.isBlank()) {
            throw new IllegalArgumentException("表示名を入力してください");
        }
        User user = ensureUser(principal);
        user.setUserName(userName.trim());
        return userRepository.save(user);
    }
}
