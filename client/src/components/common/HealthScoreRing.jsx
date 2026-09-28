import React from 'react';

export const HealthScoreRing = ({ score = 100, size = 'md', showLabel = true }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = '#10b981'; // Green (Healthy)
  let statusText = 'Healthy';
  let badgeClasses = 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800';

  if (normalizedScore < 40) {
    color = '#ef4444'; // Red (Critical)
    statusText = 'Critical';
    badgeClasses = 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800';
  } else if (normalizedScore < 60) {
    color = '#f97316'; // Orange (At Risk)
    statusText = 'At Risk';
    badgeClasses = 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/60 dark:border-orange-800';
  } else if (normalizedScore < 80) {
    color = '#d4a347'; // Champagne / Amber (Needs Attention)
    statusText = 'Needs Attention';
    badgeClasses = 'text-champagne-700 bg-champagne-50 border-champagne-200 dark:text-champagne-300 dark:bg-champagne-950/60 dark:border-champagne-800';
  }

  const dimensions = {
    sm: { width: 44, height: 44, stroke: 4, textSize: 'text-xs', labelText: 'text-[9px]' },
    md: { width: 72, height: 72, stroke: 6, textSize: 'text-base font-bold', labelText: 'text-[10px]' },
    lg: { width: 110, height: 110, stroke: 9, textSize: 'text-2xl font-extrabold', labelText: 'text-xs' },
  }[size] || { width: 72, height: 72, stroke: 6, textSize: 'text-base font-bold', labelText: 'text-[10px]' };

  const radius = (dimensions.width - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.width, height: dimensions.height }}>
        <svg
          className="transform -rotate-90"
          width={dimensions.width}
          height={dimensions.height}
        >
          {/* Background circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={dimensions.stroke}
            className="text-slate-100 dark:text-surface-darkHover"
            fill="transparent"
          />
          {/* Foreground progress circle */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={radius}
            stroke={color}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`tracking-tight leading-none ${dimensions.textSize} text-slate-800 dark:text-slate-100`}>
            {normalizedScore}
          </span>
          {size === 'lg' && (
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
              Score
            </span>
          )}
        </div>
      </div>

      {showLabel && (
        <span
          className={`mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClasses} tracking-tight`}
        >
          {statusText}
        </span>
      )}
    </div>
  );
};
