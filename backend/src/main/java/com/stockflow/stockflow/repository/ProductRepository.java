package com.stockflow.stockflow.repository;

import com.stockflow.stockflow.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    long countByCategoryId(Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.quantity <= p.minStockLevel ORDER BY p.quantity ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.quantity <= p.minStockLevel")
    long countLowStockProducts();

    @Query("SELECT COALESCE(SUM(p.quantity), 0) FROM Product p")
    long sumTotalQuantity();

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:lowStockOnly = false OR p.quantity <= p.minStockLevel) " +
           "ORDER BY p.id DESC")
    List<Product> searchProducts(@Param("keyword") String keyword,
                                 @Param("categoryId") Long categoryId,
                                 @Param("lowStockOnly") boolean lowStockOnly);
}
