package com.travel.api.service;

import com.travel.api.entity.Category;
import com.travel.api.entity.User;
import com.travel.api.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final List<String> DEFAULT_NAMES = List.of("交通費", "宿泊費", "食費", "観光・体験", "お土産", "その他");

    private final CategoryRepository categoryRepository;

    @Transactional
    public List<Category> listForUser(User user) {
        ensureDefaults(user);
        return categoryRepository.findByUserOrderByCategoryIdAsc(user);
    }

    @Transactional(readOnly = true)
    public Category requireOwned(Long categoryId, User user) {
        return categoryRepository.findByCategoryIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
    }

    private void ensureDefaults(User user) {
        for (String name : DEFAULT_NAMES) {
            if (!categoryRepository.existsByUserAndCategoryName(user, name)) {
                categoryRepository.save(Category.builder()
                        .categoryName(name)
                        .user(user)
                        .build());
            }
        }
    }
}
