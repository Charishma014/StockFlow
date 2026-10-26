import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../api/stockflowApi';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  Package,
  Layers,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage({ setNotification }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to load dashboard metrics: ' + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Loading StockFlow metrics...</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
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

  const getMovementTypeBadge = (type) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <ArrowDownLeft className="w-3.5 h-3.5" /> In
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
            <ArrowUpRight className="w-3.5 h-3.5" /> Out
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            Adj
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operational Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time inventory levels, order flow, and stock movements.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          color="indigo"
          subtitle="Catalog items"
        />
        <StatCard
          title="Categories"
          value={stats?.totalCategories ?? 0}
          icon={Layers}
          color="violet"
          subtitle="Classifications"
        />
        <StatCard
          title="Customer Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingCart}
          color="sky"
          subtitle="All recorded"
        />
        <StatCard
          title="Inventory Units"
          value={stats?.totalInventoryQuantity ?? 0}
          icon={Boxes}
          color="emerald"
          subtitle="In warehouse"
        />
        <StatCard
          title="Low-Stock Alerts"
          value={stats?.lowStockCount ?? 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Needs restock"
          alert={(stats?.lowStockCount ?? 0) > 0}
        />
        <StatCard
          title="Active Revenue"
          value={formatCurrency(stats?.totalRevenue)}
          icon={IndianRupee}
          color="emerald"
          subtitle="Non-cancelled"
        />
      </div>

      {/* Low-stock warning banner if any */}
      {(stats?.lowStockCount ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {stats.lowStockCount} product(s) have fallen below their safety threshold!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Restock these items promptly to prevent order delays and stockouts.
              </p>
            </div>
          </div>
          <Link
            to="/products?lowStock=true"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Review Low Stock
          </Link>
        </div>
      )}

      {/* Split view: Recent Orders & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400 mt-0.5">Latest 5 sales entries</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!stats?.recentOrders?.length ? (
              <p className="p-8 text-center text-sm text-slate-400">No orders recorded yet</p>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{order.orderNumber}</span>
                      {getOrderStatusBadge(order.orderStatus)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {order.customerName} • {order.totalItemCount} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-800">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-[11px] text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800">Recent Stock Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Warehouse adjustments & flow</p>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Audit log
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!stats?.recentMovements?.length ? (
              <p className="p-8 text-center text-sm text-slate-400">No stock movements recorded yet</p>
            ) : (
              stats.recentMovements.map((m) => (
                <div key={m.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{m.productName}</span>
                      {getMovementTypeBadge(m.movementType)}
                    </div>
                    <p className="text-xs text-slate-500">
                      {m.reason || 'Inventory balance update'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-800">
                      {m.movementType === 'IN' ? '+' : m.movementType === 'OUT' ? '-' : ''}
                      {m.quantity} units
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Qty: {m.previousQuantity} → {m.newQuantity}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
