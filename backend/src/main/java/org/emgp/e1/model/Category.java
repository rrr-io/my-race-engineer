package org.emgp.e1.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Category() {
    }

    public Category(String name, int sortOrder, Instant now) {
        this.name = name;
        this.sortOrder = sortOrder;
        this.active = true;
        this.createdAt = now;
    }

    public void place(int newSortOrder) {
        this.sortOrder = newSortOrder;
        this.active = true;
    }

    public void archive() {
        this.active = false;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public int getSortOrder() { return sortOrder; }
    public boolean isActive() { return active; }
}
