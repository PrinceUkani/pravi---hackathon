import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Activity,
  Wrench,
  Archive,
  ShieldAlert,
  AlertTriangle,
  Plus,
  ScanLine,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { StatCard } from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import {
  CategoryBarChart,
  StatusPieChart,
  MaintenanceCostTrendChart,
  WarrantyDonutChart,
  AgeDistributionBarChart,
} from '../components/charts/DashboardCharts';
import {
  CriticalAssetsWidget,
  WarrantyAlertsWidget,
  ReplacementCardWidget,
  UpcomingMaintenanceWidget,
  RecentActivityFeed,
} from '../components/dashboard/DashboardWidgets';

export const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getAnalytics(),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (analyticsRes.success) setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. Header & Storytelling Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Infrastructure Operations Command
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Good day, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span> &bull;{' '}
            Real-time asset telemetry, lifecycle tracking, and preventive risk alerts.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/qr-scanner')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors shadow-sm"
          >
            <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Scan QR
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/assets/new')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Asset
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      {loading ? (
        <CardSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            title="Total Assets"
            value={stats?.totalAssets ?? 0}
            icon={Boxes}
            variant="emerald"
            subtitle={`Valuation: $${(stats?.totalAssetValue || 0).toLocaleString()}`}
            onClick={() => navigate('/assets')}
          />
          <StatCard
            title="Active"
            value={stats?.activeAssets ?? 0}
            icon={Activity}
            variant="emerald"
            badgeText="Operational"
            onClick={() => navigate('/assets?status=ACTIVE')}
          />
          <StatCard
            title="In Maintenance"
            value={stats?.maintenanceAssets ?? 0}
            icon={Wrench}
            variant="amber"
            badgeText="Service"
            onClick={() => navigate('/maintenance')}
          />
          <StatCard
            title="Retired / Disposed"
            value={stats?.retiredAssets ?? 0}
            icon={Archive}
            variant="slate"
            badgeText="Archive"
            onClick={() => navigate('/assets?status=RETIRED')}
          />
          <StatCard
            title="Expiring Warranty"
            value={stats?.warrantyExpiring ?? 0}
            icon={ShieldAlert}
            variant="champagne"
            badgeText="&le; 30 Days"
            onClick={() => navigate('/assets?warrantyStatus=EXPIRING_SOON')}
          />
          <StatCard
            title="Critical Health"
            value={stats?.criticalAssets ?? 0}
            icon={AlertTriangle}
            variant="rose"
            badgeText="At Risk"
            onClick={() => navigate('/assets?condition=CRITICAL')}
          />
        </div>
      )}

      {/* 3. Hero Feature: Rule-Based Replacement Card & Urgent Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReplacementCardWidget candidates={analytics?.replacementCandidates || []} />
        </div>
        <div className="lg:col-span-1">
          <CriticalAssetsWidget assets={analytics?.criticalAssets || []} />
        </div>
        <div className="lg:col-span-1">
          <WarrantyAlertsWidget assets={analytics?.warrantyAlerts || []} />
        </div>
      </div>

      {/* 4. Analytics & Lifecycle Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Asset Distribution by Category
            </h3>
            <span className="text-[11px] text-slate-400">Inventory Units</span>
          </div>
          <CategoryBarChart data={analytics?.byCategory || []} />
        </div>

        {/* Maintenance Cost Trends */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Maintenance Spend History ($)
            </h3>
            <span className="text-[11px] font-semibold text-champagne-600 dark:text-champagne-400">
              Total Spend: ${(stats?.totalMaintenanceSpend || 0).toLocaleString()}
            </span>
          </div>
          <MaintenanceCostTrendChart data={analytics?.maintenanceCostTrend || []} />
        </div>
      </div>

      {/* 5. Additional Charts (Status, Age, Warranty) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Donut */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-2">
            Lifecycle Status Breakdown
          </h3>
          <StatusPieChart data={analytics?.byStatus || []} />
        </div>

        {/* Age Distribution */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-2">
            Hardware Age Cohorts
          </h3>
          <AgeDistributionBarChart data={analytics?.ageDistribution || []} />
        </div>

        {/* Warranty Expiration Timeline */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-2">
            Warranty Expiration Horizons
          </h3>
          <WarrantyDonutChart data={analytics?.warrantyBuckets || []} />
        </div>
      </div>

      {/* 6. Upcoming Maintenance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingMaintenanceWidget tickets={analytics?.upcomingMaintenance || []} />
        <RecentActivityFeed activities={analytics?.recentActivity || []} />
      </div>
    </div>
  );
};
