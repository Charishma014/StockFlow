import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowLeftRight,
  ShoppingCart,
  Boxes,
} from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: Layers },
    { to: '/inventory', label: 'Inventory', icon: ArrowLeftRight },
    { to: '/orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-18 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-wide">StockFlow</h1>
          <p className="text-xs text-indigo-400 font-medium">Smart Inventory & Orders</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 m-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">XAMPP MySQL Active</span>
        </div>
        <p className="text-[11px] text-slate-400">Spring Boot 4.0.9 + Java 21</p>
      </div>
    </aside>
  );
}
