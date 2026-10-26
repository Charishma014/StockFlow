import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-up shadow-xl rounded-xl overflow-hidden border">
      <div
        className={`flex items-start gap-3 p-4 ${
          isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 text-sm font-medium leading-relaxed">
          {notification.message}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
