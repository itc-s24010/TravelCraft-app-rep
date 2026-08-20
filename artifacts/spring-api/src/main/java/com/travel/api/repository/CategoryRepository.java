package com.travel.api.repository;

import com.travel.api.entity.Category;
import com.travel.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserOrderByCategoryIdAsc(User user);
    Optional<Category> findByCategoryIdAndUser(Long categoryId, User user);
    Optional<Category> findByUserAndCategoryName(User user, String categoryName);
    boolean existsByUserAndCategoryName(User user, String categoryName);
}
