package com.travel.api.controller;

import com.travel.api.entity.Category;
import com.travel.api.security.UserPrincipal;
import com.travel.api.service.CategoryService;
import com.travel.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Category create(@AuthenticationPrincipal UserPrincipal principal,
                            @RequestBody Map<String, String> body) {
        return categoryService.create(body.get("categoryName"), userService.ensureUser(principal));
    }

    @PatchMapping("/{id}")
    public Category updateColor(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long id,
                                @RequestBody Map<String, String> body) {
        return categoryService.updateColor(id, body.get("color"), userService.ensureUser(principal));
    }
}
