import React from 'react';
import {
  Calendar,
  User,
  ShoppingBag,
  PackageCheck,
  Hammer,
  UserCheck,
  RefreshCw,
  Wrench,
  CheckCircle,
  AlertCircle,
  Shield,
  Archive,
  Trash2,
} from 'lucide-react';

export const LifecycleTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No lifecycle events recorded for this asset yet.
      </div>
    );
  }

  const getActionConfig = (action) => {
    switch (action) {
      case 'PURCHASED':
        return { icon: ShoppingBag, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200' };
      case 'RECEIVED':
        return { icon: PackageCheck, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200' };
      case 'INSTALLED':
        return { icon: Hammer, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60 border-teal-200' };
      case 'ASSIGNED':
        return { icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' };
      case 'TRANSFERRED':
      case 'LOCATION_CHANGED':
        return { icon: RefreshCw, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200' };
      case 'MAINTENANCE_STARTED':
        return { icon: Wrench, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200' };
      case 'MAINTENANCE_COMPLETED':
        return { icon: CheckCircle, color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 border-emerald-300' };
      case 'CONDITION_CHANGED':
      case 'STATUS_CHANGED':
        return { icon: AlertCircle, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/60 border-orange-200' };
      case 'WARRANTY_UPDATED':
        return { icon: Shield, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-200' };
      case 'RETIRED':
        return { icon: Archive, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300' };
      case 'DISPOSED':
        return { icon: Trash2, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200' };
      default:
        return { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200' };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-surface-darkBorder">
      {history.map((event, idx) => {
        const config = getActionConfig(event.action);
        const Icon = config.icon;
        const dateStr = new Date(event.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        const timeStr = new Date(event.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={event._id || idx} className="relative flex items-start gap-4 group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-6 p-1.5 rounded-full border shadow-sm ${config.color} z-10 transition-transform group-hover:scale-110`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            {/* Event Content Card */}
            <div className="flex-1 bg-white dark:bg-surface-darkCard border border-slate-200/90 dark:border-surface-darkBorder rounded-xl p-4 shadow-subtle hover:border-emerald-500/40 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    {event.action.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-400">•</span>
                  <span className="text-xs font-semibold text-emeraldInk-800 dark:text-champagne-300">
                    {dateStr}
                  </span>
                  <span className="text-[11px] text-slate-400">at {timeStr}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{event.performedByName || event.performedBy?.name || 'System Operator'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {event.description}
              </p>

              {/* Show old/new value badge if available */}
              {(event.oldValue || event.newValue) && typeof event.newValue === 'string' && (
                <div className="mt-2 text-[11px] flex items-center gap-2 font-mono text-slate-500 dark:text-slate-400">
                  {event.oldValue && (
                    <span className="line-through text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                      {event.oldValue}
                    </span>
                  )}
                  {event.oldValue && <span>&rarr;</span>}
                  {event.newValue && (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold">
                      {event.newValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
