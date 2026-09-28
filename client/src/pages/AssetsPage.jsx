import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  RefreshCw,
  QrCode,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assetService } from '../services/assetService';
import { categoryService, locationService, departmentService } from '../services/infrastructureService';
import { StatusBadge, ConditionBadge } from '../components/common/StatusBadge';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { CSVImportModal } from '../components/assets/CSVImportModal';
import { QRCodeModal } from '../components/assets/QRCodeModal';
import toast from 'react-hot-toast';

export const AssetsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [warrantyStatus, setWarrantyStatus] = useState(searchParams.get('warrantyStatus') || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Data state
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);

  // Filter option collections
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [qrModalAsset, setQrModalAsset] = useState(null);

  // Load filter lists
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cats, locs, depts] = await Promise.all([
          categoryService.getCategories(),
          locationService.getLocations(),
          departmentService.getDepartments(),
        ]);
        setCategories(cats.data || []);
        setLocations(locs.data || []);
        setDepartments(depts.data || []);
      } catch (err) {
        console.error('Filter fetch error', err);
      }
    };
    loadFilters();
  }, []);

  // Fetch Assets
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        status: status || undefined,
        category: category || undefined,
        condition: condition || undefined,
        warrantyStatus: warrantyStatus || undefined,
      };

      const res = await assetService.getAssets(params);
      if (res.success && res.data) {
        setAssets(res.data.assets || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, page: 1 });
      }
    } catch (err) {
      toast.error('Failed to load asset inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [page, status, category, condition, warrantyStatus]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAssets();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleExportCSV = () => {
    const exportUrl = assetService.exportCSVUrl({ status, category });
    window.open(exportUrl, '_blank');
    toast.success('Generating CSV export...');
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setCondition('');
    setWarrantyStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Infrastructure Asset Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete registry of hardware assets, active locations, and live condition telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-darkHover shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-surface-darkBorder bg-white dark:bg-surface-darkCard text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-darkHover shadow-sm transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>

              <button
                onClick={() => navigate('/assets/new')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Register Asset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, brand, serial..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="INSTALLED">Installed</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="REPAIR">Repair</option>
              <option value="RETIRED">Retired</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators & Reset */}
        {(search || status || category || condition || warrantyStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-surface-darkBorder text-xs">
            <span className="text-slate-500">
              Filtering results...
            </span>
            <button
              onClick={resetFilters}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Assets Data Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            title="No assets match your search"
            description="Try loosening your filters or register a new infrastructure asset."
            actionLabel={isAdmin ? 'Register New Asset' : undefined}
            onAction={isAdmin ? () => navigate('/assets/new') : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-surface-darkBorder">
                <tr>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Asset Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Health</th>
                  <th className="py-3 px-4">Warranty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                {assets.map((asset) => {
                  const expiry = asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null;
                  const isExpiring =
                    expiry && (expiry - new Date()) / (1000 * 60 * 60 * 24) <= 30 && expiry > new Date();
                  const isExpired = expiry && expiry < new Date();

                  return (
                    <tr
                      key={asset._id}
                      onClick={() => navigate(`/assets/${asset.assetId}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-surface-darkHover cursor-pointer transition-colors group"
                    >
                      {/* Asset ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                        {asset.assetId}
                      </td>

                      {/* Name & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                          {asset.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          {asset.brand} &bull; {asset.model}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {asset.categoryName || asset.category?.name || 'General'}
                      </td>

                      {/* Serial Number */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {asset.serialNumber}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                        {asset.location ? `${asset.location.building} ${asset.location.room || ''}` : 'Unassigned'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={asset.status} />
                      </td>

                      {/* Health Ring Gauge */}
                      <td className="py-3.5 px-4 text-center">
                        <HealthScoreRing score={asset.healthScore} size="sm" showLabel={false} />
                      </td>

                      {/* Warranty */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Expired
                          </span>
                        ) : isExpiring ? (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                            Expiring Soon
                          </span>
                        ) : expiry ? (
                          <span className="text-[11px] text-slate-500">
                            {expiry.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setQrModalAsset(asset)}
                            title="Generate QR Tag"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-darkHover"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/assets/${asset.assetId}`)}
                            title="View Full Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-surface-darkHover"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-4">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={limit}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCompleted={() => {
          setIsImportOpen(false);
          fetchAssets();
        }}
      />

      {/* QR Code Modal */}
      {qrModalAsset && (
        <QRCodeModal
          isOpen={!!qrModalAsset}
          onClose={() => setQrModalAsset(null)}
          asset={qrModalAsset}
        />
      )}
    </div>
  );
};
