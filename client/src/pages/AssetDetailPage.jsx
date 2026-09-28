import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Shield,
  ShieldAlert,
  Wrench,
  QrCode,
  RefreshCw,
  Archive,
  Edit3,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Tag,
  Building,
  HardDrive,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assetService } from '../services/assetService';
import { StatusBadge, ConditionBadge } from '../components/common/StatusBadge';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import { AssetLifecycleStepper } from '../components/assets/AssetLifecycleStepper';
import { LifecycleTimeline } from '../components/assets/LifecycleTimeline';
import { QRCodeModal } from '../components/assets/QRCodeModal';
import { AssetTransferModal } from '../components/assets/AssetTransferModal';
import { AssetRetireModal } from '../components/assets/AssetRetireModal';
import { MaintenanceFormModal } from '../components/maintenance/MaintenanceFormModal';
import { TicketStatusBadge, TicketPriorityBadge } from '../components/maintenance/TicketStatusBadge';
import toast from 'react-hot-toast';

export const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isManager, isTechnician } = useAuth();

  const [asset, setAsset] = useState(null);
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [maintenanceStats, setMaintenanceStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active tab state
  const [activeTab, setActiveTab] = useState('overview'); // overview, lifecycle, maintenance, qr

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const [detailRes, historyRes] = await Promise.all([
        assetService.getAssetById(id),
        assetService.getAssetHistory(id),
      ]);

      if (detailRes.success && detailRes.data) {
        setAsset(detailRes.data.asset);
        setMaintenanceTickets(detailRes.data.maintenanceTickets || []);
        setMaintenanceStats(detailRes.data.maintenanceStats || null);
      }
      if (historyRes.success) {
        setHistory(historyRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load asset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500">Loading asset telemetry &amp; lifecycle...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Asset Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">No asset matching identifier {id}.</p>
        <button
          onClick={() => navigate('/assets')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emeraldInk-900 text-white"
        >
          Return to Inventory
        </button>
      </div>
    );
  }

  // Warranty calculations
  const now = new Date();
  const expiry = asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null;
  const isExpired = expiry && expiry < now;
  const daysRemaining = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : null;

  // Financial calculations: Total Lifecycle Cost = Purchase Cost + Maintenance Cost
  const totalLifecycleCost = (asset.purchaseCost || 0) + (asset.maintenanceCost || 0);

  return (
    <div className="space-y-6">
      {/* 1. Back Navigation & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/assets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assets
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick QR button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-sm transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            QR Tag
          </button>

          {/* Transfer button (Admin/Manager) */}
          {isAdmin && asset.status !== 'RETIRED' && asset.status !== 'DISPOSED' && (
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              Transfer / Reassign
            </button>
          )}

          {/* Open Ticket button */}
          {asset.status !== 'DISPOSED' && (
            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:border-emerald-500 shadow-sm transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-500" />
              Create Maintenance
            </button>
          )}

          {/* Retire / Dispose button */}
          {isAdmin && asset.status !== 'DISPOSED' && (
            <button
              onClick={() => setIsRetireModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:border-rose-500 shadow-sm transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              Retire / Dispose
            </button>
          )}

          {/* Edit button */}
          {isAdmin && (
            <button
              onClick={() => navigate(`/assets/${asset._id}/edit`)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* 2. Hero Asset Showcase Card */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-premium relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-lg bg-emeraldInk-950 text-champagne-300 border border-emeraldInk-800">
                {asset.assetId}
              </span>
              <StatusBadge status={asset.status} />
              <ConditionBadge condition={asset.condition} />
              {isExpired ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  <ShieldAlert className="w-3 h-3" /> Warranty Expired
                </span>
              ) : daysRemaining !== null && daysRemaining <= 30 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                  <ShieldAlert className="w-3 h-3" /> Warranty: {daysRemaining} days remaining
                </span>
              ) : daysRemaining !== null ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Shield className="w-3 h-3" /> Warranty: {daysRemaining} days remaining
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {asset.name}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Model: <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.model}</span> &bull;{' '}
              Serial: <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.serialNumber}</span> &bull;{' '}
              Category: <span className="font-semibold text-slate-700 dark:text-slate-200">{asset.categoryName || asset.category?.name}</span>
            </p>
          </div>

          {/* Health Score Circular Visualization in Hero */}
          <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50/80 dark:bg-surface-dark border border-slate-200/80 dark:border-surface-darkBorder">
            <HealthScoreRing score={asset.healthScore} size="lg" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Rule-Based Asset Health
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                {asset.healthStatus || 'Healthy'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-[150px] leading-tight">
                Derived from age, physical condition, downtime &amp; failure rate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Lifecycle Stepper */}
      <AssetLifecycleStepper currentStatus={asset.status} />

      {/* 4. Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-surface-darkBorder">
        <nav className="flex space-x-6">
          {[
            { id: 'overview', label: 'Asset Overview & Specs' },
            { id: 'lifecycle', label: `Lifecycle Timeline (${history.length})` },
            { id: 'maintenance', label: `Maintenance Records (${maintenanceTickets.length})` },
            { id: 'qr', label: 'QR Tag & Barcode' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-xs font-bold border-b-2 tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-emeraldInk-800 text-emeraldInk-900 dark:border-champagne-400 dark:text-champagne-300'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 5. TAB 1: OVERVIEW & SPECS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Details Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Lifecycle Card */}
            <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Financial &amp; Total Lifecycle Cost
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Purchase Cost
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    ${(asset.purchaseCost || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    Acquired {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Maintenance Cost
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    ${(asset.maintenanceCost || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Cumulative repairs</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/60 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                    Total Lifecycle Cost
                  </span>
                  <p className="text-base font-extrabold text-emeraldInk-900 dark:text-champagne-300 mt-1">
                    ${totalLifecycleCost.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
                    Purchase + Maintenance
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Replacement Est.
                  </span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    ${(asset.replacementCost || asset.purchaseCost * 1.1 || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Current market quote</span>
                </div>
              </div>
            </div>

            {/* Specifications & Hardware Overview */}
            <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hardware Configuration &amp; Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Manufacturer / Brand:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{asset.brand}</p>
                </div>
                <div>
                  <span className="text-slate-400">Model Specification:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{asset.model}</p>
                </div>
                <div>
                  <span className="text-slate-400">Serial Number:</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">{asset.serialNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400">Barcode / Asset Tag:</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">{asset.assetTag || asset.assetId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Equipment Type:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{asset.type || 'Standard Hardware'}</p>
                </div>
                <div>
                  <span className="text-slate-400">OEM Vendor Partner:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{asset.vendor?.name || 'Direct Enterprise'}</p>
                </div>
              </div>

              {asset.description && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-surface-darkBorder text-xs">
                  <span className="text-slate-400">Operational Purpose / Description:</span>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{asset.description}</p>
                </div>
              )}
            </div>

            {/* Location & Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Location Card */}
              <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Facility Deployment
                </h3>
                {asset.location ? (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Building / Campus:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{asset.location.building}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Floor &amp; Room:</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {asset.location.floor} &bull; {asset.location.room}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Enclosure / Rack Slot:</span>
                      <p className="font-mono font-semibold text-slate-800 dark:text-slate-100">{asset.location.rack || 'Floor Mount'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Postal Address:</span>
                      <p className="text-slate-500">{asset.location.address || 'Enterprise HQ'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No physical facility assigned.</p>
                )}
              </div>

              {/* Assignment Card */}
              <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Organizational Custody
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Department:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {asset.department?.name || 'General Operations'} ({asset.department?.code || 'GEN'})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned Custodian:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {asset.assignedTo ? asset.assignedTo.name : 'Unassigned (Shared Asset)'}
                    </p>
                    {asset.assignedTo && (
                      <p className="text-[11px] text-slate-400">{asset.assignedTo.email}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400">Preventive Maintenance Cycle:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      Every {asset.maintenanceIntervalDays || 90} days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Replacement Recommendation & Warranty Summary */}
          <div className="space-y-6">
            {/* Rule-Based Replacement Recommendation Card */}
            <div className="bg-gradient-to-br from-emeraldInk-950 to-emeraldInk-900 text-white rounded-2xl p-6 shadow-premium border border-emeraldInk-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-champagne-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-champagne-300">
                    Replacement Score
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-champagne-400/20 text-champagne-300 border border-champagne-400/30">
                  {asset.replacementPriority || 'LOW'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <div className="text-4xl font-extrabold text-champagne-400">
                  {asset.replacementScore || 0}
                </div>
                <span className="text-xs text-slate-300">/ 100 recommendation index</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emeraldInk-900/60 border border-emeraldInk-800 text-xs space-y-2">
                <p className="font-bold text-champagne-300 text-[11px] uppercase tracking-wider">
                  Algorithmic Rationale:
                </p>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {asset.replacementReasons?.length > 0 ? (
                    asset.replacementReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-champagne-400 font-bold">&bull;</span>
                        <span>{reason}</span>
                      </li>
                    ))
                  ) : (
                    <li>Operating nominally with active manufacturer warranty coverage.</li>
                  )}
                </ul>
              </div>

              <p className="text-[10px] text-slate-400 mt-4 leading-tight italic">
                Deterministic rule-based score factoring age against lifespan, cumulative failure incidents, maintenance spend ratio, and warranty coverage.
              </p>
            </div>

            {/* Warranty Coverage Card */}
            <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Warranty &amp; Vendor SLA
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-slate-400">Coverage Status:</span>
                  <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isExpired ? 'EXPIRED' : 'ACTIVE COVERAGE'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-slate-400">Provider:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {asset.warrantyProvider || asset.brand}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-slate-400">Service Level Type:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {asset.warrantyType || 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {expiry ? expiry.toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Days Remaining:</span>
                  <span className="font-bold text-emeraldInk-800 dark:text-champagne-300">
                    {daysRemaining !== null ? `${daysRemaining} days` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: LIFECYCLE TIMELINE */}
      {activeTab === 'lifecycle' && (
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Complete Lifecycle History &amp; Event Chain
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Immutable audit trail of all deployments, condition alterations, transfers, and maintenance events.
              </p>
            </div>
          </div>
          <LifecycleTimeline history={history} />
        </div>
      )}

      {/* 7. TAB 3: MAINTENANCE TICKETS */}
      {activeTab === 'maintenance' && (
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Service &amp; Maintenance Tickets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total Service Events: {maintenanceStats?.totalCount || 0} &bull; Total Spend: ${(maintenanceStats?.totalCost || 0).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => setIsTicketModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5" />
              Open New Ticket
            </button>
          </div>

          {maintenanceTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No maintenance tickets have been recorded for this asset.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-surface-darkBorder">
                  <tr>
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Issue</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Assigned Tech</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                  {maintenanceTickets.map((t) => (
                    <tr
                      key={t._id}
                      onClick={() => navigate(`/maintenance/${t._id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-surface-darkHover cursor-pointer"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                        {t.ticketId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {t.issue}
                      </td>
                      <td className="py-3 px-3">
                        <TicketPriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {t.assignedTechnician?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(t.createdDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        ${(t.actualCost || t.estimatedCost || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 4: QR CODE PREVIEW & PRINT */}
      {activeTab === 'qr' && (
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle flex flex-col items-center">
          <div className="max-w-md w-full text-center space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Hardware Identification &amp; Field QR Scanner Tag
            </h3>
            <p className="text-xs text-slate-500">
              Attach this physical label to the server rack, chassis, or peripheral. Any field technician can scan it using mobile camera to immediately bring up this record.
            </p>

            <button
              onClick={() => setIsQRModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-md transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Open High-Resolution QR Tag Modal
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        asset={asset}
      />

      <AssetTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        asset={asset}
        onTransferred={() => fetchAssetDetails()}
      />

      <AssetRetireModal
        isOpen={isRetireModalOpen}
        onClose={() => setIsRetireModalOpen(false)}
        asset={asset}
        onComplete={() => fetchAssetDetails()}
      />

      <MaintenanceFormModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        preselectedAsset={asset}
        onTicketCreated={() => fetchAssetDetails()}
      />
    </div>
  );
};
