package com.travel.api.config;

import com.travel.api.entity.Category;
import com.travel.api.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (categoryRepository.count() == 0) {
            List<String> names = List.of("交通費", "宿泊費", "食費", "観光・体験", "お土産", "その他");
            names.forEach(name -> categoryRepository.save(Category.builder().categoryName(name).build()));
        }
    }
}
