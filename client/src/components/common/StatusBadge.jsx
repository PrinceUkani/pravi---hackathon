import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    ACTIVE: {
      label: 'Active',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
    ASSIGNED: {
      label: 'Assigned',
      classes: 'bg-emerald-50/80 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
      dot: 'bg-emerald-600',
    },
    INSTALLED: {
      label: 'Installed',
      classes: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
      dot: 'bg-teal-500',
    },
    RECEIVED: {
      label: 'Received',
      classes: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800',
      dot: 'bg-cyan-500',
    },
    PROCUREMENT: {
      label: 'Procurement',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    MAINTENANCE: {
      label: 'Maintenance',
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      dot: 'bg-amber-500 animate-pulse',
    },
    REPAIR: {
      label: 'In Repair',
      classes: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    REPLACEMENT_REQUESTED: {
      label: 'Replace Req.',
      classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    DAMAGED: {
      label: 'Damaged',
      classes: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    LOST: {
      label: 'Lost',
      classes: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      dot: 'bg-red-600',
    },
    RETIRED: {
      label: 'Retired',
      classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    DISPOSED: {
      label: 'Disposed',
      classes: 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      dot: 'bg-gray-500',
    },
  };

  const config = statusConfig[status] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} tracking-wide whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export const ConditionBadge = ({ condition }) => {
  const conditionConfig = {
    EXCELLENT: {
      label: 'Excellent',
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
    GOOD: {
      label: 'Good',
      classes: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800',
    },
    FAIR: {
      label: 'Fair',
      classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    },
    POOR: {
      label: 'Poor',
      classes: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
    },
    CRITICAL: {
      label: 'Critical',
      classes: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 animate-pulse',
    },
  };

  const config = conditionConfig[condition] || {
    label: condition || 'Unknown',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${config.classes} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};
