import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { HealthScoreRing } from '../common/HealthScoreRing';

// 1. Critical Assets Widget
export const CriticalAssetsWidget = ({ assets = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Critical Assets Needing Attention
          </h3>
        </div>
        <button
          onClick={() => navigate('/assets?condition=CRITICAL')}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder flex-1">
        {assets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            All infrastructure assets are healthy within nominal limits.
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset._id}
              onClick={() => navigate(`/assets/${asset.assetId}`)}
              className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-surface-darkHover px-1 rounded-lg cursor-pointer transition-colors"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emeraldInk-800 dark:text-emerald-400">
                    {asset.assetId}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {asset.name}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {asset.brand} • {asset.location?.building || 'Unassigned location'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <HealthScoreRing score={asset.healthScore} size="sm" showLabel={false} />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {asset.healthScore}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 2. Warranty Alerts Widget
export const WarrantyAlertsWidget = ({ assets = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Warranties Expiring Soon (&le;30 Days)
          </h3>
        </div>
        <button
          onClick={() => navigate('/assets?warrantyStatus=EXPIRING_SOON')}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder flex-1">
        {assets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No warranties expiring in the immediate 30-day window.
          </div>
        ) : (
          assets.map((asset) => {
            const expiry = new Date(asset.warrantyExpiry);
            const daysLeft = Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));

            return (
              <div
                key={asset._id}
                onClick={() => navigate(`/assets/${asset.assetId}`)}
                className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-surface-darkHover px-1 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emeraldInk-800 dark:text-emerald-400">
                      {asset.assetId}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {asset.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Provider: {asset.warrantyProvider || asset.brand}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                    {daysLeft} days left
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {expiry.toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// 3. Replacement Card Widget
export const ReplacementCardWidget = ({ candidates = [] }) => {
  const navigate = useNavigate();
  const topCandidate = candidates[0];

  if (!topCandidate) return null;

  return (
    <div className="bg-gradient-to-br from-emeraldInk-950 to-emeraldInk-900 text-white rounded-2xl p-6 shadow-premium border border-emeraldInk-800 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Champagne glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-champagne-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-champagne-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-champagne-300">
              Rule-Based Replacement Recommendation
            </span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-champagne-400/20 text-champagne-300 border border-champagne-400/30">
            {topCandidate.replacementPriority} PRIORITY
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <h4 className="text-xl font-bold text-white tracking-tight">
              {topCandidate.name}
            </h4>
            <p className="font-mono text-xs text-emerald-300/80 mt-0.5">
              Asset ID: {topCandidate.assetId} &bull; {topCandidate.brand}
            </p>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-champagne-400 leading-none">
              {topCandidate.replacementScore}
              <span className="text-sm font-normal text-emerald-300/60">/100</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold mt-1">
              Score
            </p>
          </div>
        </div>

        {/* Why? Reasons */}
        <div className="mt-4 p-3.5 rounded-xl bg-emeraldInk-900/60 border border-emeraldInk-800/80 text-xs">
          <p className="font-semibold text-champagne-300 mb-2">Why Replace?</p>
          <ul className="space-y-1.5 text-slate-300 text-[11px]">
            {topCandidate.replacementReasons?.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-champagne-400 font-bold">&bull;</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between pt-4 border-t border-emeraldInk-800/60">
        <span className="text-xs text-emerald-200/70">
          Estimated Replacement: ${(topCandidate.purchaseCost * 1.1).toLocaleString()}
        </span>
        <button
          onClick={() => navigate(`/assets/${topCandidate.assetId}`)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-champagne-500 hover:bg-champagne-600 text-emeraldInk-950 transition-colors shadow-sm flex items-center gap-1.5"
        >
          Review Recommendation <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// 4. Upcoming Preventive Maintenance Widget
export const UpcomingMaintenanceWidget = ({ tickets = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emeraldInk-950/50 text-emerald-700 dark:text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Upcoming Preventive Maintenance
          </h3>
        </div>
        <button
          onClick={() => navigate('/maintenance')}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder flex-1">
        {tickets.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No pending maintenance tickets.
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t._id}
              onClick={() => navigate(`/maintenance/${t._id}`)}
              className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-surface-darkHover px-1 rounded-lg cursor-pointer transition-colors"
            >
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emeraldInk-800 dark:text-emerald-400">
                    {t.ticketId}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {t.issue}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Asset: {t.asset?.assetId || 'N/A'} • Assigned: {t.assignedTechnician?.name || 'Unassigned'}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(t.dueDate).toLocaleDateString()}
                </span>
                <div className="mt-0.5">
                  <StatusBadge status={t.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 5. Recent Activity Feed
export const RecentActivityFeed = ({ activities = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Recent Lifecycle Activity
          </h3>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-surface-darkBorder flex-1">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No recent activity logged.
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item._id}
              onClick={() => item.asset && navigate(`/assets/${item.asset.assetId}`)}
              className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-surface-darkHover px-1 rounded-lg cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {item.action.replace('_', ' ')} &bull; {item.asset?.assetId}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              </div>

              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
