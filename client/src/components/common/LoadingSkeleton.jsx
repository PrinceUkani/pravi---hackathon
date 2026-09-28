import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      {/* Table header */}
      <div className="h-10 bg-slate-200 dark:bg-emeraldInk-950/40 rounded-lg w-full" />
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-8 bg-slate-100 dark:bg-surface-darkHover rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-28 rounded-xl bg-slate-200 dark:bg-surface-darkCard border border-slate-100 dark:border-surface-darkBorder p-5 flex flex-col justify-between"
        >
          <div className="h-4 bg-slate-300 dark:bg-surface-darkHover rounded w-24" />
          <div className="h-8 bg-slate-300 dark:bg-surface-darkHover rounded w-16" />
        </div>
      ))}
    </div>
  );
};
