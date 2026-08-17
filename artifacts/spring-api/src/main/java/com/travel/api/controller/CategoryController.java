package com.travel.api.controller;

import com.travel.api.entity.Category;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.CategoryService;
import com.travel.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    @GetMapping
    public List<Category> getAll(@AuthenticationPrincipal UserPrincipal principal) {
        return categoryService.listForUser(userService.ensureUser(principal));
    }
}
