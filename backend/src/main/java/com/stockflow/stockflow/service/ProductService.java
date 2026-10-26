package com.stockflow.stockflow.service;

import com.stockflow.stockflow.dto.ProductRequest;
import com.stockflow.stockflow.dto.ProductResponse;
import com.stockflow.stockflow.entity.Category;
import com.stockflow.stockflow.entity.Product;
import com.stockflow.stockflow.entity.StockMovement;
import com.stockflow.stockflow.entity.enums.StockMovementType;
import com.stockflow.stockflow.exception.ConflictException;
import com.stockflow.stockflow.exception.ResourceNotFoundException;
import com.stockflow.stockflow.repository.CategoryRepository;
import com.stockflow.stockflow.repository.OrderItemRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final OrderItemRepository orderItemRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts(String keyword, Long categoryId, Boolean lowStockOnly) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        boolean lowStockFlag = Boolean.TRUE.equals(lowStockOnly);

        return productRepository.searchProducts(cleanKeyword, categoryId, lowStockFlag).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return mapToResponse(findProductOrThrow(id));
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        String sku = request.getSku().trim().toUpperCase();
        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new ConflictException("Product with SKU '" + sku + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        Product product = Product.builder()
                .name(request.getName().trim())
                .sku(sku)
                .description(request.getDescription())
                .price(request.getPrice())
                .quantity(request.getQuantity())
                .minStockLevel(request.getMinStockLevel())
                .category(category)
                .build();

        Product saved = productRepository.save(product);

        if (saved.getQuantity() > 0) {
            StockMovement movement = StockMovement.builder()
                    .product(saved)
                    .movementType(StockMovementType.IN)
                    .quantity(saved.getQuantity())
                    .previousQuantity(0)
                    .newQuantity(saved.getQuantity())
                    .reason("Initial stock on product creation")
                    .build();
            stockMovementRepository.save(movement);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = findProductOrThrow(id);
        String sku = request.getSku().trim().toUpperCase();

        if (productRepository.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ConflictException("Product with SKU '" + sku + "' already exists");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        int previousQty = product.getQuantity();
        int newQty = request.getQuantity();

        product.setName(request.getName().trim());
        product.setSku(sku);
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setMinStockLevel(request.getMinStockLevel());
        product.setCategory(category);
        product.setQuantity(newQty);

        Product updated = productRepository.save(product);

        if (previousQty != newQty) {
            int diff = Math.abs(newQty - previousQty);
            StockMovementType type = newQty > previousQty ? StockMovementType.IN : StockMovementType.OUT;
            StockMovement movement = StockMovement.builder()
                    .product(updated)
                    .movementType(type)
                    .quantity(diff)
                    .previousQuantity(previousQty)
                    .newQuantity(newQty)
                    .reason("Manual quantity update via product edit")
                    .build();
            stockMovementRepository.save(movement);
        }

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = findProductOrThrow(id);
        if (orderItemRepository.existsByProductId(id)) {
            throw new ConflictException("Cannot delete product '" + product.getName() + "' (SKU: " + product.getSku() + ") because it is referenced in existing customer orders.");
        }
        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .description(product.getDescription())
                .price(product.getPrice())
                .quantity(product.getQuantity())
                .minStockLevel(product.getMinStockLevel())
                .lowStock(product.isLowStock())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
