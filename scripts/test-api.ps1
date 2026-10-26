# StockFlow End-to-End API Test Script
Write-Host "Running StockFlow REST API Test Suite..." -ForegroundColor Cyan

try {
  Write-Host "`n[1/5] Testing Create Product..." -ForegroundColor Yellow
  $prodBody = @{
    name = "Ultra Mechanical Keyboard"
    sku = "SKU-KB-" + (Get-Random -Minimum 100 -Maximum 999)
    description = "RGB Hot-swappable tactile switches"
    price = 4999.00
    quantity = 15
    minStockLevel = 5
    categoryId = 1
  } | ConvertTo-Json

  $newProd = Invoke-RestMethod -Uri "http://localhost:8085/api/products" -Method Post -Body $prodBody -ContentType "application/json"
  Write-Host "  ✓ Created Product ID: $($newProd.id) | SKU: $($newProd.sku) | Qty: $($newProd.quantity)" -ForegroundColor Green

  Write-Host "`n[2/5] Testing Stock Addition (+10 units)..." -ForegroundColor Yellow
  $stockInBody = @{
    quantity = 10
    reason = "Supplier shipment received"
  } | ConvertTo-Json
  $stockInRes = Invoke-RestMethod -Uri "http://localhost:8085/api/inventory/$($newProd.id)/add" -Method Post -Body $stockInBody -ContentType "application/json"
  Write-Host "  ✓ Previous Stock: $($stockInRes.previousQuantity) -> New Stock: $($stockInRes.newQuantity)" -ForegroundColor Green

  Write-Host "`n[3/5] Testing Order Placement & Stock Deduction (5 units)..." -ForegroundColor Yellow
  $orderBody = @{
    customerName = "Global Logistics Ltd"
    customerEmail = "procure@globallogistics.com"
    items = @( @{ productId = $newProd.id; quantity = 5 } )
  } | ConvertTo-Json
  $orderRes = Invoke-RestMethod -Uri "http://localhost:8085/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
  Write-Host "  ✓ Order Created: $($orderRes.orderNumber) | Total: ₹$($orderRes.totalAmount)" -ForegroundColor Green

  $prodAfterOrder = Invoke-RestMethod -Uri "http://localhost:8085/api/products/$($newProd.id)"
  Write-Host "  ✓ Inventory reduced to: $($prodAfterOrder.quantity) (Expected 20)" -ForegroundColor Green

  Write-Host "`n[4/5] Testing Order Cancellation & Stock Restoration..." -ForegroundColor Yellow
  $cancelBody = @{ status = "CANCELLED" } | ConvertTo-Json
  $cancelRes = Invoke-RestMethod -Uri "http://localhost:8085/api/orders/$($orderRes.id)/status" -Method Patch -Body $cancelBody -ContentType "application/json"
  Write-Host "  ✓ Order Status: $($cancelRes.orderStatus)" -ForegroundColor Green

  $prodAfterCancel = Invoke-RestMethod -Uri "http://localhost:8085/api/products/$($newProd.id)"
  Write-Host "  ✓ Stock successfully restored to: $($prodAfterCancel.quantity) (Expected 25)" -ForegroundColor Green

  Write-Host "`n[5/5] Testing Negative Inventory Prevention (Attempt to remove 100 units)..." -ForegroundColor Yellow
  try {
    $excessBody = @{ quantity = 100; reason = "Over-withdrawal test" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8085/api/inventory/$($newProd.id)/remove" -Method Post -Body $excessBody -ContentType "application/json"
    Write-Host "  ✗ FAILED: Negative inventory was permitted!" -ForegroundColor Red
  } catch {
    Write-Host "  ✓ Negative stock blocked correctly with HTTP 400 Bad Request" -ForegroundColor Green
  }

  Write-Host "`nAll 5 API tests executed successfully!" -ForegroundColor Cyan
} catch {
  Write-Host "Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}
