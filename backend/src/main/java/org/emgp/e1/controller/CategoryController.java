package org.emgp.e1.controller;

import org.emgp.e1.model.Category;
import org.emgp.e1.service.CategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CategoryController {

    public record CategoryResponse(long id, String name) {}

    public record CategoriesResponse(List<CategoryResponse> categories) {}

    public record UpdateRequest(List<String> names) {}

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/categories")
    public CategoriesResponse list() {
        return respond(service.active());
    }

    @PutMapping("/api/admin/categories")
    public CategoriesResponse update(@RequestBody UpdateRequest request) {
        return respond(service.replaceActive(request.names()));
    }

    private static CategoriesResponse respond(List<Category> categories) {
        return new CategoriesResponse(categories.stream().map(c -> new CategoryResponse(c.getId(), c.getName())).toList());
    }
}
