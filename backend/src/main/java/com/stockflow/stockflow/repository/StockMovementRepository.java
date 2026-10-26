package com.stockflow.stockflow.repository;

import com.stockflow.stockflow.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByTimestampDesc(Long productId);
    List<StockMovement> findAllByOrderByTimestampDesc();
    List<StockMovement> findTop10ByOrderByTimestampDesc();
}
