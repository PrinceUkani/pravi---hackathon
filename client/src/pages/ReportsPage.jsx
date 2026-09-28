import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  ShieldAlert,
  Wrench,
  Activity,
  Boxes,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { reportService } from '../services/infrastructureService';
import { assetService } from '../services/assetService';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import toast from 'react-hot-toast';

export const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('inventory'); // inventory, warranty, maintenance, health
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (reportType) => {
    setLoading(true);
    try {
      let res;
      if (reportType === 'inventory') res = await reportService.getAssetReport();
      else if (reportType === 'warranty') res = await reportService.getWarrantyReport();
      else if (reportType === 'maintenance') res = await reportService.getMaintenanceReport();
      else if (reportType === 'health') res = await reportService.getHealthReport();

      if (res && res.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const handleDownloadCSV = () => {
    const exportUrl = assetService.exportCSVUrl();
    window.open(exportUrl, '_blank');
    toast.success('Downloading report CSV...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Infrastructure Intelligence &amp; Executive Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics directly queried from MongoDB. Zero simulated dummy report rows.
          </p>
        </div>

        <button
          onClick={handleDownloadCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Complete CSV
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-surface-darkBorder">
        {[
          { id: 'inventory', label: 'Asset Inventory & Valuation', icon: Boxes },
          { id: 'warranty', label: 'Warranty Risk & Horizons', icon: ShieldAlert },
          { id: 'maintenance', label: 'Service & Maintenance Spend', icon: Wrench },
          { id: 'health', label: 'Asset Health & Replacement Scoring', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emeraldInk-900 text-white shadow-sm'
                  : 'bg-white dark:bg-surface-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-surface-darkBorder hover:border-emerald-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Report Content Panel */}
      {loading ? (
        <div className="p-8">
          <TableSkeleton rows={8} cols={6} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. ASSET INVENTORY REPORT */}
          {activeReport === 'inventory' && Array.isArray(data) && (
            <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-surface-darkBorder flex items-center justify-between bg-slate-50/50 dark:bg-surface-dark">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Full Asset Registry ({data.length} registered hardware items)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Asset ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Serial</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                      <th className="py-2.5 px-3 text-right">Maint. Spend</th>
                      <th className="py-2.5 px-3 text-right">Total Lifecycle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                    {data.slice(0, 25).map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-surface-darkHover">
                        <td className="py-2.5 px-3 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                          {a.assetId}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">{a.name}</td>
                        <td className="py-2.5 px-3 text-slate-500">{a.category?.name || 'Hardware'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{a.serialNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-[150px]">
                          {a.location ? `${a.location.building} ${a.location.room || ''}` : 'Unassigned'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">${(a.purchaseCost || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono">${(a.maintenanceCost || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                          ${((a.purchaseCost || 0) + (a.maintenanceCost || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. WARRANTY RISK REPORT */}
          {activeReport === 'warranty' && data?.summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Expired Warranties
                  </span>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
                    {data.summary.expiredCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Expiring &le; 30 Days
                  </span>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
                    {data.summary.expiringSoonCount}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Active SLA Coverage
                  </span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {data.summary.activeCount}
                  </p>
                </div>
              </div>

              {/* Expiring List Table */}
              <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-surface-darkBorder">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Assets Requiring Imminent Warranty Renewal
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Asset ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Manufacturer</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                      {(data.expiringSoon || []).map((a) => (
                        <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-surface-darkHover">
                          <td className="py-2.5 px-3 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                            {a.assetId}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">{a.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{a.brand}</td>
                          <td className="py-2.5 px-3 text-slate-500">{a.department?.name || 'General'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600">
                            {new Date(a.warrantyExpiry).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. MAINTENANCE SPEND REPORT */}
          {activeReport === 'maintenance' && data?.summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Service Tickets</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.summary.totalTickets}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Resolved Tickets</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">{data.summary.resolvedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total Repair Spend</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                    ${data.summary.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Cost / Resolution</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
                    ${data.summary.avgCost.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Tickets list */}
              <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-surface-darkBorder">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Maintenance Service Log
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Ticket ID</th>
                        <th className="py-2.5 px-3">Asset</th>
                        <th className="py-2.5 px-3">Issue</th>
                        <th className="py-2.5 px-3">Technician</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Incurred Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                      {(data.tickets || []).slice(0, 20).map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-surface-darkHover">
                          <td className="py-2.5 px-3 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                            {t.ticketId}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            {t.asset?.assetId} &bull; {t.asset?.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{t.issue}</td>
                          <td className="py-2.5 px-3 text-slate-500">{t.assignedTechnician?.name || 'Unassigned'}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">{t.status}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            ${(t.actualCost || t.estimatedCost || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. HEALTH & REPLACEMENT SCORING REPORT */}
          {activeReport === 'health' && data?.healthSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/40 border border-emerald-200 text-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Healthy (80–100)</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{data.healthSummary.healthy}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-center">
                  <span className="text-[10px] text-amber-800 uppercase font-bold">Needs Attention (60–79)</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{data.healthSummary.needsAttention}</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 text-center">
                  <span className="text-[10px] text-orange-800 uppercase font-bold">At Risk (40–59)</span>
                  <p className="text-2xl font-black text-orange-700 mt-1">{data.healthSummary.atRisk}</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-center">
                  <span className="text-[10px] text-rose-800 uppercase font-bold">Critical (&lt;40)</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{data.healthSummary.critical}</p>
                </div>
              </div>

              {/* Table of Highest Replacement Candidates */}
              <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200 dark:border-surface-darkBorder overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-surface-darkBorder">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Highest Priority Hardware Replacement Candidates
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Asset ID</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3 text-center">Health Score</th>
                        <th className="py-2.5 px-3 text-center">Replacement Score</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3">Algorithmic Rationale</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                      {(data.assets || []).slice(0, 20).map((a) => (
                        <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-surface-darkHover">
                          <td className="py-2.5 px-3 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                            {a.assetId}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">{a.name}</td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {a.healthScore}/100
                          </td>
                          <td className="py-2.5 px-3 text-center font-black font-mono text-champagne-600 dark:text-champagne-400">
                            {a.replacementScore}/100
                          </td>
                          <td className="py-2.5 px-3 font-bold text-xs uppercase">{a.replacementPriority}</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 truncate max-w-[280px]">
                            {a.replacementReasons?.[0] || 'Nominal telemetry'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
