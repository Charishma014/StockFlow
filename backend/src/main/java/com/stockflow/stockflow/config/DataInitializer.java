package com.stockflow.stockflow.config;

import com.stockflow.stockflow.dto.OrderItemRequest;
import com.stockflow.stockflow.dto.OrderRequest;
import com.stockflow.stockflow.entity.Category;
import com.stockflow.stockflow.entity.Product;
import com.stockflow.stockflow.entity.StockMovement;
import com.stockflow.stockflow.entity.enums.StockMovementType;
import com.stockflow.stockflow.repository.CategoryRepository;
import com.stockflow.stockflow.repository.OrderRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import com.stockflow.stockflow.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Database already contains data. Skipping sample data initialization.");
            return;
        }

        log.info("Seeding initial sample data for StockFlow...");

        // 1. Categories
        Category electronics = categoryRepository.save(Category.builder()
                .name("Electronics")
                .description("Electronic gadgets, accessories, and computing equipment")
                .build());

        Category furniture = categoryRepository.save(Category.builder()
                .name("Office Furniture")
                .description("Ergonomic chairs, desks, and storage solutions")
                .build());

        Category stationery = categoryRepository.save(Category.builder()
                .name("Stationery & Supplies")
                .description("Paper, pens, filing accessories, and everyday office consumables")
                .build());

        // 2. Products
        Product laptop = createProduct("ProBook 15 G9 Laptop", "SKU-LAP-001",
                "15.6 inch Intel Core i7, 16GB RAM, 512GB SSD workstation",
                new BigDecimal("84999.00"), 25, 5, electronics);

        Product mouse = createProduct("Ergonomic Wireless Mouse", "SKU-MOU-002",
                "2.4GHz silent optical mouse with USB-C rechargeable battery",
                new BigDecimal("1499.00"), 4, 10, electronics); // low stock!

        Product monitor = createProduct("UltraSharp 27-inch 4K Monitor", "SKU-MON-003",
                "IPS panel, USB-C 90W power delivery, 99% sRGB color gamut",
                new BigDecimal("32999.00"), 12, 3, electronics);

        Product chair = createProduct("Mesh High-Back Ergonomic Chair", "SKU-CHA-101",
                "Adjustable lumbar support, 3D armrests, breathable mesh",
                new BigDecimal("12499.00"), 8, 4, furniture);

        Product desk = createProduct("Electric Standing Desk 140x70", "SKU-DSK-102",
                "Dual motor motorized height-adjustable workstation desk",
                new BigDecimal("24999.00"), 2, 3, furniture); // low stock!

        Product notebook = createProduct("Hardcover Executive Notebook", "SKU-NOT-201",
                "A5 160-page lined journal with elastic band and pen loop",
                new BigDecimal("399.00"), 85, 20, stationery);

        log.info("Sample categories and products seeded successfully.");

        // 3. Sample Orders
        try {
            orderService.createOrder(OrderRequest.builder()
                    .customerName("Acme Corp Pvt Ltd")
                    .customerEmail("procurement@acmecorp.com")
                    .items(List.of(
                            OrderItemRequest.builder().productId(laptop.getId()).quantity(2).build(),
                            OrderItemRequest.builder().productId(mouse.getId()).quantity(2).build()
                    ))
                    .build());

            orderService.createOrder(OrderRequest.builder()
                    .customerName("TechNova Labs")
                    .customerEmail("office@technova.io")
                    .items(List.of(
                            OrderItemRequest.builder().productId(chair.getId()).quantity(1).build(),
                            OrderItemRequest.builder().productId(notebook.getId()).quantity(5).build()
                    ))
                    .build());

            log.info("Sample customer orders seeded successfully.");
        } catch (Exception e) {
            log.warn("Could not seed sample orders: {}", e.getMessage());
        }
    }

    private Product createProduct(String name, String sku, String desc, BigDecimal price, int qty, int minStock, Category category) {
        Product p = productRepository.save(Product.builder()
                .name(name)
                .sku(sku)
                .description(desc)
                .price(price)
                .quantity(qty)
                .minStockLevel(minStock)
                .category(category)
                .build());

        stockMovementRepository.save(StockMovement.builder()
                .product(p)
                .movementType(StockMovementType.IN)
                .quantity(qty)
                .previousQuantity(0)
                .newQuantity(qty)
                .reason("Initial seed inventory")
                .build());

        return p;
    }
}
