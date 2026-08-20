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

    @Transactional
    public Category create(String categoryName, User user) {
        if (categoryName == null || categoryName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }

        String normalizedName = categoryName.trim();
        return categoryRepository.findByUserAndCategoryName(user, normalizedName)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .categoryName(normalizedName)
                        .user(user)
                        .build()));
    }

    @Transactional
    public Category requireOwnedOrCreate(Long categoryId, String customCategoryName, User user) {
        if (customCategoryName != null && !customCategoryName.isBlank()) {
            return create(customCategoryName, user);
        }
        if (categoryId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required");
        }
        return requireOwned(categoryId, user);
    }

    @Transactional
    public Category updateColor(Long categoryId, String color, User user) {
        Category cat = categoryRepository.findByCategoryIdAndUser(categoryId, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        cat.setColor(color == null || color.isBlank() ? null : color.trim());
        return categoryRepository.save(cat);
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
