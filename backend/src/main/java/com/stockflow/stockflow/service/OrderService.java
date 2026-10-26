package com.stockflow.stockflow.service;

import com.stockflow.stockflow.dto.*;
import com.stockflow.stockflow.entity.Order;
import com.stockflow.stockflow.entity.OrderItem;
import com.stockflow.stockflow.entity.Product;
import com.stockflow.stockflow.entity.StockMovement;
import com.stockflow.stockflow.entity.enums.OrderStatus;
import com.stockflow.stockflow.entity.enums.StockMovementType;
import com.stockflow.stockflow.exception.BadRequestException;
import com.stockflow.stockflow.exception.InsufficientStockException;
import com.stockflow.stockflow.exception.ResourceNotFoundException;
import com.stockflow.stockflow.repository.OrderRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        String orderNumber = generateOrderNumber();

        // Validate stock availability for all items first
        Map<Product, Integer> itemQuantities = new LinkedHashMap<>();
        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemReq.getProductId()));

            int currentAssigned = itemQuantities.getOrDefault(product, 0);
            int newTotalRequired = currentAssigned + itemReq.getQuantity();

            if (product.getQuantity() < newTotalRequired) {
                throw new InsufficientStockException("Insufficient stock for product '" + product.getName() +
                        "' (SKU: " + product.getSku() + "). Available: " + product.getQuantity() +
                        ", requested: " + newTotalRequired);
            }

            itemQuantities.put(product, newTotalRequired);
        }

        // Build Order
        Order order = Order.builder()
                .orderNumber(orderNumber)
                .customerName(request.getCustomerName().trim())
                .customerEmail(request.getCustomerEmail() != null ? request.getCustomerEmail().trim() : null)
                .orderStatus(OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId()).get();
            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            calculatedTotal = calculatedTotal.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            order.addItem(orderItem);

            // Deduct stock and record stock movement
            int previousQty = product.getQuantity();
            int newQty = previousQty - itemReq.getQuantity();
            product.setQuantity(newQty);
            productRepository.save(product);

            StockMovement movement = StockMovement.builder()
                    .product(product)
                    .movementType(StockMovementType.OUT)
                    .quantity(itemReq.getQuantity())
                    .previousQuantity(previousQty)
                    .newQuantity(newQty)
                    .reason("Order placed: " + orderNumber)
                    .build();
            stockMovementRepository.save(movement);
        }

        order.setTotalAmount(calculatedTotal);
        Order savedOrder = orderRepository.save(order);

        return mapToResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status) {
        List<Order> orders = (status != null)
                ? orderRepository.findByOrderStatusOrderByCreatedAtDesc(status)
                : orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = findOrderOrThrow(id);
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = findOrderOrThrow(id);
        OrderStatus oldStatus = order.getOrderStatus();
        OrderStatus newStatus = request.getStatus();

        if (oldStatus == newStatus) {
            return mapToResponse(order);
        }

        if (oldStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already CANCELLED and its status cannot be changed");
        }

        // If transitioning to CANCELLED, restore product stock!
        if (newStatus == OrderStatus.CANCELLED) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    int previousQty = product.getQuantity();
                    int newQty = previousQty + item.getQuantity();
                    product.setQuantity(newQty);
                    productRepository.save(product);

                    StockMovement movement = StockMovement.builder()
                            .product(product)
                            .movementType(StockMovementType.IN)
                            .quantity(item.getQuantity())
                            .previousQuantity(previousQty)
                            .newQuantity(newQty)
                            .reason("Restored stock from cancelled order: " + order.getOrderNumber())
                            .build();
                    stockMovementRepository.save(movement);
                }
            }
        }

        order.setOrderStatus(newStatus);
        Order updated = orderRepository.save(order);
        return mapToResponse(updated);
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomSuffix = new Random().nextInt(900) + 100;
        return "ORD-" + timestamp + "-" + randomSuffix;
    }

    public OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productSku(item.getProductSku())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        int totalItems = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .orderStatus(order.getOrderStatus())
                .totalAmount(order.getTotalAmount())
                .totalItemCount(totalItems)
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
