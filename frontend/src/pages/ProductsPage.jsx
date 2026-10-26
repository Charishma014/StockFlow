import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, categoryApi, inventoryApi } from '../api/stockflowApi';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  PlusCircle,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';

export default function ProductsPage({ setNotification }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(
    searchParams.get('lowStock') === 'true'
  );

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockActionType, setStockActionType] = useState('add'); // 'add' | 'remove'
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    quantity: '',
    minStockLevel: '5',
    categoryId: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodData, catData] = await Promise.all([
        productApi.getAll({
          keyword: keyword || undefined,
          categoryId: selectedCategory || undefined,
          lowStockOnly: lowStockOnly || undefined,
        }),
        categoryApi.getAll(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Error fetching products: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [keyword, selectedCategory, lowStockOnly]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      quantity: '',
      minStockLevel: '5',
      categoryId: categories.length > 0 ? categories[0].id : '',
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      minStockLevel: product.minStockLevel,
      categoryId: product.categoryId || '',
    });
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        minStockLevel: parseInt(formData.minStockLevel, 10),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      };

      if (editingProduct) {
        await productApi.update(editingProduct.id, payload);
        setNotification({
          type: 'success',
          message: `Product "${payload.name}" updated successfully.`,
        });
      } else {
        await productApi.create(payload);
        setNotification({
          type: 'success',
          message: `Product "${payload.name}" created successfully.`,
        });
      }

      setIsAddEditOpen(false);
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

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setSubmitting(true);
      await productApi.delete(productToDelete.id);
      setNotification({
        type: 'success',
        message: `Product "${productToDelete.name}" deleted successfully.`,
      });
      setIsDeleteOpen(false);
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

  const handleOpenStockModal = (product, type) => {
    setStockProduct(product);
    setStockActionType(type);
    setStockQty(1);
    setStockReason(type === 'add' ? 'Supplier shipment received' : 'Damaged / waste reduction');
    setIsStockModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        quantity: parseInt(stockQty, 10),
        reason: stockReason,
      };

      if (stockActionType === 'add') {
        await inventoryApi.addStock(stockProduct.id, payload);
        setNotification({
          type: 'success',
          message: `Added ${stockQty} unit(s) to "${stockProduct.name}".`,
        });
      } else {
        await inventoryApi.removeStock(stockProduct.id, payload);
        setNotification({
          type: 'success',
          message: `Removed ${stockQty} unit(s) from "${stockProduct.name}".`,
        });
      }

      setIsStockModalOpen(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your items, tracking codes, inventory levels, and pricing.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const nextVal = !lowStockOnly;
              setLowStockOnly(nextVal);
              setSearchParams(nextVal ? { lowStock: 'true' } : {});
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors shrink-0 ${
              lowStockOnly
                ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Level</th>
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
                      Loading catalog...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description || '-'}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500">
                      {p.sku}
                    </td>
                    <td className="px-6 py-4">
                      {p.categoryName ? (
                        <Badge variant="purple">{p.categoryName}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{p.quantity}</span>
                        <span className="text-xs text-slate-400">(min {p.minStockLevel})</span>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            title="Add stock"
                            onClick={() => handleOpenStockModal(p, 'add')}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            title="Remove stock"
                            onClick={() => handleOpenStockModal(p, 'remove')}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.lowStock ? (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setProductToDelete(p);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ergonomic Keyboard"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                SKU Tracking Code *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SKU-KEY-001"
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none bg-white"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2499.00"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Initial / Current Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="25"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Low-Stock Threshold *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                placeholder="5"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Specifications, supplier details, or item dimensions..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Stock In / Stock Out Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={stockActionType === 'add' ? `Add Stock: ${stockProduct?.name}` : `Remove Stock: ${stockProduct?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveStock} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
            <p>SKU: <span className="font-mono font-semibold">{stockProduct?.sku}</span></p>
            <p>Current In Warehouse: <span className="font-bold text-slate-800">{stockProduct?.quantity} units</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Quantity to {stockActionType === 'add' ? 'Add' : 'Remove'} *
            </label>
            <input
              type="number"
              min="1"
              max={stockActionType === 'remove' ? stockProduct?.quantity : undefined}
              required
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
            {stockActionType === 'remove' && (
              <p className="text-[11px] text-slate-400 mt-1">
                Cannot remove more than the available balance ({stockProduct?.quantity}).
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
              value={stockReason}
              onChange={(e) => setStockReason(e.target.value)}
              placeholder="e.g. PO-8899 restocking"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
                stockActionType === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {submitting ? 'Updating...' : stockActionType === 'add' ? 'Confirm Addition' : 'Confirm Removal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}" (SKU: ${productToDelete?.sku})? This action cannot be undone.`}
        confirmText="Delete Product"
        isLoading={submitting}
      />
    </div>
  );
}
