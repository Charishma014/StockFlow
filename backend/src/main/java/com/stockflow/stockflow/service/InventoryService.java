package com.stockflow.stockflow.service;

import com.stockflow.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.stockflow.dto.StockMovementResponse;
import com.stockflow.stockflow.entity.Product;
import com.stockflow.stockflow.entity.StockMovement;
import com.stockflow.stockflow.entity.enums.StockMovementType;
import com.stockflow.stockflow.exception.InsufficientStockException;
import com.stockflow.stockflow.exception.ResourceNotFoundException;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public StockMovementResponse addStock(Long productId, StockAdjustmentRequest request) {
        Product product = findProductOrThrow(productId);
        int previousQty = product.getQuantity();
        int addedQty = request.getQuantity();
        int newQty = previousQty + addedQty;

        product.setQuantity(newQty);
        productRepository.save(product);

        String reason = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim()
                : "Manual stock addition";

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(StockMovementType.IN)
                .quantity(addedQty)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .reason(reason)
                .build();

        StockMovement saved = stockMovementRepository.save(movement);
        return mapToResponse(saved);
    }

    @Transactional
    public StockMovementResponse removeStock(Long productId, StockAdjustmentRequest request) {
        Product product = findProductOrThrow(productId);
        int previousQty = product.getQuantity();
        int removedQty = request.getQuantity();

        if (previousQty < removedQty) {
            throw new InsufficientStockException("Cannot remove " + removedQty + " units. Current stock for product '" +
                    product.getName() + "' is only " + previousQty + ".");
        }

        int newQty = previousQty - removedQty;
        product.setQuantity(newQty);
        productRepository.save(product);

        String reason = (request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim()
                : "Manual stock removal";

        StockMovement movement = StockMovement.builder()
                .product(product)
                .movementType(StockMovementType.OUT)
                .quantity(removedQty)
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .reason(reason)
                .build();

        StockMovement saved = stockMovementRepository.save(movement);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getStockMovements(Long productId) {
        List<StockMovement> movements = (productId != null)
                ? stockMovementRepository.findByProductIdOrderByTimestampDesc(productId)
                : stockMovementRepository.findAllByOrderByTimestampDesc();

        return movements.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getRecentMovements() {
        return stockMovementRepository.findTop10ByOrderByTimestampDesc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public StockMovementResponse mapToResponse(StockMovement movement) {
        return StockMovementResponse.builder()
                .id(movement.getId())
                .productId(movement.getProduct().getId())
                .productName(movement.getProduct().getName())
                .productSku(movement.getProduct().getSku())
                .movementType(movement.getMovementType())
                .quantity(movement.getQuantity())
                .previousQuantity(movement.getPreviousQuantity())
                .newQuantity(movement.getNewQuantity())
                .reason(movement.getReason())
                .timestamp(movement.getTimestamp())
                .build();
    }
}
