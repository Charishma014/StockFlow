import React, { useEffect, useState } from 'react';
import { inventoryApi, productApi } from '../api/stockflowApi';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function InventoryPage({ setNotification }) {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedProductId, setSelectedProductId] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' | 'remove'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movData, prodData, lowData] = await Promise.all([
        inventoryApi.getMovements(selectedProductId || undefined),
        productApi.getAll(),
        productApi.getLowStock(),
      ]);
      setMovements(movData);
      setProducts(prodData);
      setLowStockProducts(lowData);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to load inventory data: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProductId]);

  const handleOpenActionModal = (type, preselectedProductId = '') => {
    setModalType(type);
    setFormData({
      productId: preselectedProductId || (products.length > 0 ? products[0].id : ''),
      quantity: '1',
      reason: type === 'add' ? 'Supplier shipment received' : 'Damaged / waste reduction',
    });
    setIsModalOpen(true);
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    if (!formData.productId) {
      setNotification({ type: 'error', message: 'Please select a product' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        quantity: parseInt(formData.quantity, 10),
        reason: formData.reason.trim(),
      };

      if (modalType === 'add') {
        await inventoryApi.addStock(formData.productId, payload);
        setNotification({
          type: 'success',
          message: `Added ${payload.quantity} units to inventory.`,
        });
      } else {
        await inventoryApi.removeStock(formData.productId, payload);
        setNotification({
          type: 'success',
          message: `Removed ${payload.quantity} units from inventory.`,
        });
      }

      setIsModalOpen(false);
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

  const getMovementTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Stock IN
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg text-rose-700 bg-rose-50 border border-rose-200">
            <ArrowUpRight className="w-3.5 h-3.5" /> Stock OUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg text-amber-700 bg-amber-50 border border-amber-200">
            Adjustment
          </span>
        );
    }
  };

  const selectedProductObj = products.find((p) => p.id === Number(formData.productId));

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory & Stock Tracking</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Maintain balance accuracy, record shipments, and monitor warehouse flow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenActionModal('add')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Add Stock
          </button>
          <button
            onClick={() => handleOpenActionModal('remove')}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <MinusCircle className="w-4 h-4" />
            Remove Stock
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-base">
                Critical Low Stock Notice ({lowStockProducts.length} items)
              </h3>
              <p className="text-xs text-amber-700">
                The following products are at or below safety stock levels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-xs text-slate-800 line-clamp-1">{p.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
                  <p className="text-xs font-bold text-rose-600 mt-1">
                    {p.quantity} units left <span className="text-slate-400 font-normal">(threshold {p.minStockLevel})</span>
                  </p>
                </div>
                <button
                  onClick={() => handleOpenActionModal('add', p.id)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition-colors shrink-0"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800">Stock Movement Audit Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable ledger of all inbound, outbound, and manual quantity revisions
            </p>
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            >
              <option value="">Filter: All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Movement Type</th>
                <th className="px-6 py-4">Quantity Change</th>
                <th className="px-6 py-4">Stock Balance</th>
                <th className="px-6 py-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      Loading stock audit movements...
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No movements recorded yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {formatDate(m.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{m.productName}</p>
                      <p className="text-xs font-mono text-slate-400">{m.productSku}</p>
                    </td>
                    <td className="px-6 py-4">{getMovementTypeBadge(m.movementType)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold text-sm ${
                          m.movementType === 'IN'
                            ? 'text-emerald-600'
                            : m.movementType === 'OUT'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {m.movementType === 'IN' ? '+' : m.movementType === 'OUT' ? '-' : ''}
                        {m.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <span className="text-slate-400">{m.previousQuantity}</span> →{' '}
                      <span className="font-bold text-slate-800">{m.newQuantity}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs">
                      {m.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Remove Stock Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'add' ? 'Add Stock (Inbound Shipment)' : 'Remove Stock (Adjustment / Outbound)'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Select Product *
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none bg-white"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.quantity})
                </option>
              ))}
            </select>
          </div>

          {selectedProductObj && (
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
              <p>SKU: <span className="font-mono font-semibold">{selectedProductObj.sku}</span></p>
              <p>Current Inventory: <span className="font-bold text-slate-800">{selectedProductObj.quantity} units</span></p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Quantity to {modalType === 'add' ? 'Add' : 'Remove'} *
            </label>
            <input
              type="number"
              min="1"
              max={modalType === 'remove' && selectedProductObj ? selectedProductObj.quantity : undefined}
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
            {modalType === 'remove' && selectedProductObj && (
              <p className="text-[11px] text-slate-400 mt-1">
                StockFlow strictly blocks negative inventory. Max removable: {selectedProductObj.quantity}.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Reason / Reference *
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={modalType === 'add' ? 'e.g. PO-9988 delivery' : 'e.g. Expired / Damaged goods'}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
                modalType === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {submitting ? 'Processing...' : modalType === 'add' ? 'Record Addition' : 'Record Removal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
