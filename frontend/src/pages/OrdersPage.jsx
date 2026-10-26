import React, { useEffect, useState } from 'react';
import { orderApi, productApi } from '../api/stockflowApi';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  ShoppingCart,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function OrdersPage({ setNotification }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Order Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderItems, setOrderItems] = useState([
    { productId: '', quantity: 1 },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderData, prodData] = await Promise.all([
        orderApi.getAll(statusFilter || undefined),
        productApi.getAll(),
      ]);
      setOrders(orderData);
      setProducts(prodData);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to load orders: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setCustomerName('');
    setCustomerEmail('');
    const firstProd = products.find((p) => p.quantity > 0);
    setOrderItems([{ productId: firstProd ? firstProd.id : '', quantity: 1 }]);
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    const unselected = products.find(
      (p) => p.quantity > 0 && !orderItems.some((item) => Number(item.productId) === p.id)
    );
    setOrderItems([
      ...orderItems,
      { productId: unselected ? unselected.id : products[0]?.id || '', quantity: 1 },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  // Calculate live total
  const calculatedTotal = orderItems.reduce((acc, item) => {
    const prod = products.find((p) => p.id === Number(item.productId));
    if (!prod) return acc;
    const qty = parseInt(item.quantity, 10) || 0;
    return acc + Number(prod.price) * qty;
  }, 0);

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setNotification({ type: 'error', message: 'Customer name is required' });
      return;
    }

    if (orderItems.some((item) => !item.productId || item.quantity < 1)) {
      setNotification({ type: 'error', message: 'Please select valid products and quantities' });
      return;
    }

    // Check for stock availability client side before sending
    for (const item of orderItems) {
      const prod = products.find((p) => p.id === Number(item.productId));
      if (prod && item.quantity > prod.quantity) {
        setNotification({
          type: 'error',
          message: `Product "${prod.name}" has only ${prod.quantity} units available.`,
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        items: orderItems.map((item) => ({
          productId: Number(item.productId),
          quantity: parseInt(item.quantity, 10),
        })),
      };

      const created = await orderApi.create(payload);
      setNotification({
        type: 'success',
        message: `Order #${created.orderNumber} created successfully! Inventory deducted.`,
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setSubmitting(true);
      const updated = await orderApi.updateStatus(orderId, newStatus);
      setNotification({
        type: 'success',
        message: `Order #${updated.orderNumber} updated to ${newStatus}. ${
          newStatus === 'CANCELLED' ? 'Stock restored to inventory.' : ''
        }`,
      });
      fetchData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Process sales orders, track status, and manage automated inventory deductions.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No orders found. Click "Create Order" to place one.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800 text-xs">
                      {ord.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{ord.customerName}</p>
                      <p className="text-xs text-slate-400">{ord.customerEmail || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {ord.totalItemCount} unit(s)
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {formatCurrency(ord.totalAmount)}
                    </td>
                    <td className="px-6 py-4">{getOrderStatusBadge(ord.orderStatus)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setIsViewOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Status update menu */}
                        {ord.orderStatus !== 'CANCELLED' && (
                          <div className="relative inline-block text-left">
                            <select
                              value={ord.orderStatus}
                              onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 focus:outline-none cursor-pointer"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCEL (RESTORE)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Order"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Reliance Retail / John Smith"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="contact@client.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Line items section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Order Items ({orderItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Product
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {orderItems.map((item, index) => {
                const prod = products.find((p) => p.id === Number(item.productId));
                const itemQty = parseInt(item.quantity, 10) || 0;
                const isOverStock = prod && itemQty > prod.quantity;

                return (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-start md:items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <div className="flex-1 w-full">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      >
                        <option value="">Select product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                            {p.name} — ₹{p.price} ({p.quantity === 0 ? 'Out of stock' : `${p.quantity} available`})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="1"
                        max={prod ? prod.quantity : undefined}
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none ${
                          isOverStock
                            ? 'border-rose-400 bg-rose-50 text-rose-700'
                            : 'border-slate-200'
                        }`}
                      />
                    </div>

                    <div className="w-28 text-right text-xs font-bold text-slate-800">
                      {prod ? formatCurrency(Number(prod.price) * itemQty) : '₹0.00'}
                    </div>

                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total summary footer */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-700 font-medium">Estimated Order Total</p>
              <p className="text-xs text-indigo-500">Live subtotal including all items</p>
            </div>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(calculatedTotal)}</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || calculatedTotal <= 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Order Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 mb-0.5">Order Number</p>
                <p className="font-mono font-bold text-slate-800">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Customer</p>
                <p className="font-bold text-slate-800">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Date Placed</p>
                <p className="font-semibold text-slate-700">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">Status</p>
                <div>{getOrderStatusBadge(selectedOrder.orderStatus)}</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Purchased Items</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Unit Price</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{item.productSku}</td>
                        <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{item.quantity}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 text-right">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-right">Total:</td>
                      <td className="px-4 py-3 text-right text-indigo-700">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Quick Status Update inside View Modal */}
            {selectedOrder.orderStatus !== 'CANCELLED' && (
              <div className="p-4 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-900">Need to cancel this order?</p>
                  <p className="text-[11px] text-amber-700">
                    Cancelling immediately restores all {selectedOrder.totalItemCount} items back into warehouse inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                  className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Order & Restore Stock
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
