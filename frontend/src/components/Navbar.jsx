import React from 'react';
import { Database, Server, Clock } from 'lucide-react';

export default function Navbar({ title }) {
  return (
    <header className="h-18 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>stockflow_db:3306</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>API Connected :8085</span>
        </div>
      </div>
    </header>
  );
}
