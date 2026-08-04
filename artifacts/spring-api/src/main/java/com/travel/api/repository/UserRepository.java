package com.travel.api.repository;

import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findBySupabaseUserId(String supabaseUserId);
}
