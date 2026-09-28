import React from 'react';

export const TicketStatusBadge = ({ status }) => {
  const configs = {
    OPEN: {
      label: 'Open',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    },
    ASSIGNED: {
      label: 'Assigned',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      classes: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 animate-pulse',
    },
    ON_HOLD: {
      label: 'On Hold',
      classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    },
    RESOLVED: {
      label: 'Resolved',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    },
    CLOSED: {
      label: 'Closed',
      classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
    },
  };

  const config = configs[status] || {
    label: status || 'Unknown',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.classes} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};

export const TicketPriorityBadge = ({ priority }) => {
  const configs = {
    LOW: {
      label: 'Low',
      classes: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300',
    },
    MEDIUM: {
      label: 'Medium',
      classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300',
    },
    HIGH: {
      label: 'High',
      classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300',
    },
    CRITICAL: {
      label: 'Critical',
      classes: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 font-bold',
    },
  };

  const config = configs[priority] || {
    label: priority || 'Medium',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] uppercase font-semibold border ${config.classes} whitespace-nowrap`}
    >
      {config.label}
    </span>
  );
};
