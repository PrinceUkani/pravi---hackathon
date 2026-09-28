import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  badgeText,
  onClick,
}) => {
  const variantStyles = {
    emerald: {
      border: 'border-slate-200/90 dark:border-surface-darkBorder hover:border-emerald-500/40',
      iconBg: 'bg-emerald-50 text-emerald-700 dark:bg-emeraldInk-900/60 dark:text-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    },
    champagne: {
      border: 'border-slate-200/90 dark:border-surface-darkBorder hover:border-champagne-500/40',
      iconBg: 'bg-amber-50 text-champagne-700 dark:bg-champagne-950/60 dark:text-champagne-300',
      badge: 'bg-amber-50 text-champagne-700 dark:bg-champagne-950/50 dark:text-champagne-300',
    },
    amber: {
      border: 'border-slate-200/90 dark:border-surface-darkBorder hover:border-amber-500/40',
      iconBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    },
    rose: {
      border: 'border-slate-200/90 dark:border-surface-darkBorder hover:border-rose-500/40',
      iconBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    },
    slate: {
      border: 'border-slate-200/90 dark:border-surface-darkBorder hover:border-slate-400',
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
  }[variant] || variantStyles.emerald;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl bg-white dark:bg-surface-darkCard border ${variantStyles.border} shadow-subtle hover:shadow-premium transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {badgeText && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${variantStyles.badge}`}
              >
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg ${variantStyles.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
