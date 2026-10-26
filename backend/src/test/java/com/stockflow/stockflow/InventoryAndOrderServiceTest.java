package com.stockflow.stockflow;

import com.stockflow.stockflow.dto.OrderItemRequest;
import com.stockflow.stockflow.dto.OrderRequest;
import com.stockflow.stockflow.dto.OrderStatusUpdateRequest;
import com.stockflow.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.stockflow.entity.Order;
import com.stockflow.stockflow.entity.OrderItem;
import com.stockflow.stockflow.entity.Product;
import com.stockflow.stockflow.entity.StockMovement;
import com.stockflow.stockflow.entity.enums.OrderStatus;
import com.stockflow.stockflow.exception.InsufficientStockException;
import com.stockflow.stockflow.repository.OrderRepository;
import com.stockflow.stockflow.repository.ProductRepository;
import com.stockflow.stockflow.repository.StockMovementRepository;
import com.stockflow.stockflow.service.InventoryService;
import com.stockflow.stockflow.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryAndOrderServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @InjectMocks
    private OrderService orderService;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
                .id(1L)
                .name("Wireless Mouse")
                .sku("SKU-WM-001")
                .price(new BigDecimal("999.00"))
                .quantity(10)
                .minStockLevel(3)
                .build();
    }

    @Test
    void addStock_Success() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                .quantity(5)
                .reason("Restocking shipment")
                .build();

        var response = inventoryService.addStock(1L, request);

        assertEquals(15, testProduct.getQuantity());
        assertEquals(15, response.getNewQuantity());
        assertEquals(10, response.getPreviousQuantity());
        verify(productRepository, times(1)).save(testProduct);
    }

    @Test
    void removeStock_InsufficientQuantity_ThrowsException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                .quantity(15) // exceeds current 10
                .reason("Damaged batch")
                .build();

        assertThrows(InsufficientStockException.class, () -> inventoryService.removeStock(1L, request));
        verify(productRepository, never()).save(testProduct);
    }

    @Test
    void createOrder_ReducesStockSuccessfully() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderRequest orderReq = OrderRequest.builder()
                .customerName("John Doe")
                .customerEmail("john@example.com")
                .items(List.of(OrderItemRequest.builder().productId(1L).quantity(4).build()))
                .build();

        var response = orderService.createOrder(orderReq);

        assertNotNull(response);
        assertEquals(6, testProduct.getQuantity()); // 10 - 4 = 6
        assertEquals(new BigDecimal("3996.00"), response.getTotalAmount()); // 4 * 999
        verify(productRepository, times(1)).save(testProduct);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }

    @Test
    void createOrder_ExceedingStock_ThrowsInsufficientStockException() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        OrderRequest orderReq = OrderRequest.builder()
                .customerName("Jane Doe")
                .customerEmail("jane@example.com")
                .items(List.of(OrderItemRequest.builder().productId(1L).quantity(15).build()))
                .build();

        assertThrows(InsufficientStockException.class, () -> orderService.createOrder(orderReq));
        assertEquals(10, testProduct.getQuantity()); // unchanged
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    void cancelOrder_RestoresStockSuccessfully() {
        testProduct.setQuantity(6); // after 4 deducted

        OrderItem item = OrderItem.builder()
                .id(101L)
                .product(testProduct)
                .productName(testProduct.getName())
                .productSku(testProduct.getSku())
                .quantity(4)
                .unitPrice(testProduct.getPrice())
                .subtotal(new BigDecimal("3996.00"))
                .build();

        Order order = Order.builder()
                .id(50L)
                .orderNumber("ORD-TEST-001")
                .customerName("John Doe")
                .orderStatus(OrderStatus.PENDING)
                .totalAmount(new BigDecimal("3996.00"))
                .items(new ArrayList<>(List.of(item)))
                .build();
        item.setOrder(order);

        when(orderRepository.findById(50L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderStatusUpdateRequest updateReq = OrderStatusUpdateRequest.builder()
                .status(OrderStatus.CANCELLED)
                .build();

        var response = orderService.updateOrderStatus(50L, updateReq);

        assertEquals(OrderStatus.CANCELLED, response.getOrderStatus());
        assertEquals(10, testProduct.getQuantity()); // 6 + 4 restored to 10
        verify(productRepository, times(1)).save(testProduct);
        verify(stockMovementRepository, times(1)).save(any(StockMovement.class));
    }
}
