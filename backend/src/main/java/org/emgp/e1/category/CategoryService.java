package org.emgp.e1.category;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    static final int MAX_CATEGORIES = 20;
    static final int MAX_NAME_LENGTH = 80;

    private final CategoryRepository repository;
    private final Clock clock;

    public CategoryService(CategoryRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Category> active() {
        return repository.findByActiveTrueOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public Optional<Category> find(long id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public Map<Long, String> namesById(Collection<Long> ids) {
        return repository.findAllById(ids).stream().collect(Collectors.toMap(Category::getId, Category::getName));
    }

    /**
     * Makes exactly these names the active categories, in this order. A name that already exists (any case) keeps
     * its category, so today's proofs for it still count; names left out are archived, never deleted.
     */
    @Transactional
    public List<Category> replaceActive(List<String> rawNames) {
        List<String> names = clean(rawNames);
        if (names.size() > MAX_CATEGORIES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + MAX_CATEGORIES + " categories");
        }
        if (names.stream().anyMatch(n -> n.length() > MAX_NAME_LENGTH)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category names are limited to " + MAX_NAME_LENGTH + " characters");
        }

        Map<String, Category> byName = new HashMap<>();
        for (Category category : repository.findAll()) {
            byName.merge(key(category.getName()), category, (a, b) -> a.getId() > b.getId() ? a : b);
        }
        Set<Long> keep = new HashSet<>();
        for (int i = 0; i < names.size(); i++) {
            Category category = byName.get(key(names.get(i)));
            if (category == null) {
                category = repository.save(new Category(names.get(i), i, clock.instant()));
            } else {
                category.place(i);
            }
            keep.add(category.getId());
        }
        for (Category category : repository.findAll()) {
            if (category.isActive() && !keep.contains(category.getId())) {
                category.archive();
            }
        }
        return active();
    }

    private static List<String> clean(List<String> raw) {
        Map<String, String> unique = new LinkedHashMap<>();
        for (String name : raw == null ? List.<String>of() : raw) {
            String trimmed = name == null ? "" : name.trim().replaceAll("\\s+", " ");
            if (!trimmed.isEmpty()) {
                unique.putIfAbsent(key(trimmed), trimmed);
            }
        }
        return new ArrayList<>(unique.values());
    }

    private static String key(String name) {
        return name.toLowerCase(Locale.ROOT);
    }
}
