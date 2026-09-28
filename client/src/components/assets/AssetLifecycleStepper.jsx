import React from 'react';
import {
  ShoppingBag,
  PackageCheck,
  Hammer,
  UserCheck,
  Activity,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Archive,
  Trash2,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { key: 'PROCUREMENT', label: 'Procured', icon: ShoppingBag },
  { key: 'RECEIVED', label: 'Received', icon: PackageCheck },
  { key: 'INSTALLED', label: 'Installed', icon: Hammer },
  { key: 'ASSIGNED', label: 'Assigned', icon: UserCheck },
  { key: 'ACTIVE', label: 'Active', icon: Activity },
  { key: 'MAINTENANCE', label: 'Maintenance', icon: Wrench },
  { key: 'REPAIR', label: 'Repair', icon: AlertTriangle },
  { key: 'REPLACEMENT_REQUESTED', label: 'Replacement', icon: RotateCcw },
  { key: 'RETIRED', label: 'Retired', icon: Archive },
  { key: 'DISPOSED', label: 'Disposed', icon: Trash2 },
];

export const AssetLifecycleStepper = ({ currentStatus = 'ACTIVE' }) => {
  // Find current step index
  let currentIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStatus);
  if (currentIndex === -1) currentIndex = 4; // default to ACTIVE

  return (
    <div className="w-full bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Lifecycle Stage Progression
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Current stage:{' '}
            <span className="font-semibold text-emeraldInk-800 dark:text-emerald-400">
              {currentStatus.replace('_', ' ')}
            </span>
          </p>
        </div>
      </div>

      {/* Stepper horizontal track */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[760px] justify-between relative">
          {/* Background connecting line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-surface-darkBorder z-0" />

          {LIFECYCLE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            let circleClass = 'bg-slate-100 dark:bg-surface-dark text-slate-400 border-slate-300 dark:border-surface-darkBorder';
            let labelClass = 'text-slate-400 dark:text-slate-500';

            if (isCurrent) {
              circleClass =
                'bg-emeraldInk-900 text-champagne-300 border-champagne-400 ring-4 ring-champagne-400/20 scale-110';
              labelClass = 'text-emeraldInk-950 dark:text-champagne-300 font-bold';
            } else if (isCompleted) {
              circleClass =
                'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700';
              labelClass = 'text-slate-700 dark:text-slate-300 font-medium';
            }

            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center flex-1 text-center"
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${circleClass}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[11px] mt-2 tracking-tight ${labelClass}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
