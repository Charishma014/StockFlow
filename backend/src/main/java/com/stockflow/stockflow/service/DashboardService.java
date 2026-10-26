package com.stockflow.stockflow.service;

import com.stockflow.stockflow.dto.DashboardStatsResponse;
import com.stockflow.stockflow.dto.OrderResponse;
import com.stockflow.stockflow.dto.StockMovementResponse;
import com.stockflow.stockflow.repository.CategoryRepository;
import com.stockflow.stockflow.repository.OrderRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final StockMovementRepository stockMovementRepository;
    private final OrderService orderService;
    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalProducts = productRepository.count();
        long totalCategories = categoryRepository.count();
        long totalOrders = orderRepository.count();
        long totalInventoryQuantity = productRepository.sumTotalQuantity();
        long lowStockCount = productRepository.countLowStockProducts();
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();

        List<OrderResponse> recentOrders = orderRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .limit(5)
                .map(orderService::mapToResponse)
                .collect(Collectors.toList());

        List<StockMovementResponse> recentMovements = stockMovementRepository.findTop10ByOrderByTimestampDesc().stream()
                .limit(5)
                .map(inventoryService::mapToResponse)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalCategories(totalCategories)
                .totalOrders(totalOrders)
                .totalInventoryQuantity(totalInventoryQuantity)
                .lowStockCount(lowStockCount)
                .totalRevenue(totalRevenue)
                .recentOrders(recentOrders)
                .recentMovements(recentMovements)
                .build();
    }
}
