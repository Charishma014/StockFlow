package com.stockflow.stockflow.controller;

import com.stockflow.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.stockflow.dto.StockMovementResponse;
import com.stockflow.stockflow.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/{productId}/add")
    public ResponseEntity<StockMovementResponse> addStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(inventoryService.addStock(productId, request));
    }

    @PostMapping("/{productId}/remove")
    public ResponseEntity<StockMovementResponse> removeStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(inventoryService.removeStock(productId, request));
    }

    @GetMapping("/movements")
    public ResponseEntity<List<StockMovementResponse>> getStockMovements(
            @RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(inventoryService.getStockMovements(productId));
    }

    @GetMapping("/movements/recent")
    public ResponseEntity<List<StockMovementResponse>> getRecentMovements() {
        return ResponseEntity.ok(inventoryService.getRecentMovements());
    }
}
