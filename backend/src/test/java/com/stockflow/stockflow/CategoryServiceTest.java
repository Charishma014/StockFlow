package com.stockflow.stockflow;

import com.stockflow.stockflow.dto.CategoryRequest;
import com.stockflow.stockflow.dto.CategoryResponse;
import com.stockflow.stockflow.entity.Category;
import com.stockflow.stockflow.exception.ConflictException;
import com.stockflow.stockflow.repository.CategoryRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category testCategory;

    @BeforeEach
    void setUp() {
        testCategory = Category.builder()
                .id(1L)
                .name("Electronics")
                .description("Test description")
                .build();
    }

    @Test
    void createCategory_Success() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Electronics")
                .description("Test description")
                .build();

        when(categoryRepository.existsByNameIgnoreCase("Electronics")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(testCategory);
        when(productRepository.countByCategoryId(1L)).thenReturn(0L);

        CategoryResponse response = categoryService.createCategory(request);

        assertNotNull(response);
        assertEquals("Electronics", response.getName());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void createCategory_DuplicateName_ThrowsConflictException() {
        CategoryRequest request = CategoryRequest.builder()
                .name("Electronics")
                .description("Test description")
                .build();

        when(categoryRepository.existsByNameIgnoreCase("Electronics")).thenReturn(true);

        assertThrows(ConflictException.class, () -> categoryService.createCategory(request));
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void deleteCategory_WithAssociatedProducts_ThrowsConflictException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(testCategory));
        when(productRepository.countByCategoryId(1L)).thenReturn(3L);

        assertThrows(ConflictException.class, () -> categoryService.deleteCategory(1L));
        verify(categoryRepository, never()).delete(any(Category.class));
    }
}
