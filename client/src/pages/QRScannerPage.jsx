import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Camera,
  Search,
  ExternalLink,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { assetService } from '../services/assetService';
import { StatusBadge, ConditionBadge } from '../components/common/StatusBadge';
import { HealthScoreRing } from '../components/common/HealthScoreRing';
import toast from 'react-hot-toast';

export const QRScannerPage = () => {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const scannerRef = useRef(null);

  const handleLookup = async (idToLookup) => {
    const cleanId = idToLookup.trim();
    if (!cleanId) return;

    setLoading(true);
    try {
      // If full URL was scanned, extract asset ID
      let lookupKey = cleanId;
      if (cleanId.includes('/assets/')) {
        lookupKey = cleanId.split('/assets/')[1].split('?')[0].split('#')[0];
      }

      const res = await assetService.getAssetById(lookupKey);
      if (res.success && res.data?.asset) {
        setScannedAsset(res.data.asset);
        toast.success(`Identified: ${res.data.asset.name} (${res.data.asset.assetId})`);
      } else {
        toast.error(`No asset found matching "${lookupKey}".`);
      }
    } catch (err) {
      toast.error('Asset lookup failed. Check identifier.');
    } finally {
      setLoading(false);
    }
  };

  const startCameraScanner = () => {
    setCameraActive(true);
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setCameraActive(false);
            handleLookup(decodedText);
          },
          (error) => {
            // ignore scan frame errors
          }
        );
        scannerRef.current = scanner;
      } catch (err) {
        console.error('Camera initialization error', err);
        toast.error('Camera access is not permitted or unavailable in this environment. Use manual ID lookup.');
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emeraldInk-950/60 text-emerald-700 dark:text-emerald-400 mb-1">
          <ScanLine className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Field Asset QR &amp; Barcode Scanner
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Scan hardware QR labels on servers and networking racks, or lookup by Asset ID to immediately retrieve telemetry.
        </p>
      </div>

      {/* Camera vs Manual Tabs / Controls */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-6">
        {/* Camera Toggle */}
        <div className="text-center">
          {!cameraActive ? (
            <button
              onClick={startCameraScanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" />
              Activate Optical Camera Scanner
            </button>
          ) : (
            <div className="space-y-4">
              <div id="qr-reader-container" className="max-w-sm mx-auto overflow-hidden rounded-xl border" />
              <button
                onClick={stopCameraScanner}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100"
              >
                Close Camera
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-surface-darkBorder w-full" />
          <span className="bg-white dark:bg-surface-darkCard px-3 text-[11px] font-bold uppercase text-slate-400">
            Or Manual Hardware ID Fallback
          </span>
        </div>

        {/* Manual Lookup Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(manualId);
          }}
          className="flex gap-2 max-w-lg mx-auto"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. SRV-000124 (Dell PowerEdge R740)"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !manualId.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Finding...' : 'Identify Asset'}
          </button>
        </form>

        {/* Demo Fast Fill Pill */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setManualId('SRV-000124');
              handleLookup('SRV-000124');
            }}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            Try Demo Asset: <span className="font-mono font-bold">SRV-000124</span> (Dell PowerEdge R740)
          </button>
        </div>
      </div>

      {/* Scanned / Identified Asset Result Card */}
      {scannedAsset && (
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border-2 border-emerald-500/30 p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-surface-darkBorder">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emeraldInk-950 text-champagne-300">
                  {scannedAsset.assetId}
                </span>
                <StatusBadge status={scannedAsset.status} />
                <ConditionBadge condition={scannedAsset.condition} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {scannedAsset.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {scannedAsset.brand} &bull; {scannedAsset.model} &bull; SN: {scannedAsset.serialNumber}
              </p>
            </div>

            <HealthScoreRing score={scannedAsset.healthScore} size="md" />
          </div>

          {/* Quick specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Facility Location</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {scannedAsset.location ? `${scannedAsset.location.building} - ${scannedAsset.location.room || ''}` : 'Unassigned'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rack Enclosure</span>
              <p className="font-mono font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {scannedAsset.location?.rack || 'Floor Unit'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {scannedAsset.department?.name || 'IT Infrastructure'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Warranty Status</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                {scannedAsset.warrantyExpiry ? new Date(scannedAsset.warrantyExpiry).toLocaleDateString() : 'None'}
              </p>
            </div>
          </div>

          {/* Quick Actions Drawer for Technician */}
          <div className="pt-2 flex flex-wrap items-center gap-2 justify-end">
            <button
              onClick={() => navigate(`/assets/${scannedAsset.assetId}`)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Asset Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
