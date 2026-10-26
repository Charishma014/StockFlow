package com.stockflow.stockflow.repository;

import com.stockflow.stockflow.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    boolean existsByProductId(Long productId);
    List<OrderItem> findByOrderId(Long orderId);
}
