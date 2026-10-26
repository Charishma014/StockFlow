package com.stockflow.stockflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;
    private long totalCategories;
    private long totalOrders;
    private long totalInventoryQuantity;
    private long lowStockCount;
    private BigDecimal totalRevenue;
    private List<OrderResponse> recentOrders;
    private List<StockMovementResponse> recentMovements;
}
