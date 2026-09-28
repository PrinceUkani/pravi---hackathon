import React, { useState } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { assetService } from '../../services/assetService';
import toast from 'react-hot-toast';

export const AssetRetireModal = ({ isOpen, onClose, asset, onComplete }) => {
  const [mode, setMode] = useState('RETIRE'); // 'RETIRE' or 'DISPOSE'
  const [submitting, setSubmitting] = useState(false);

  // Retirement form
  const [retireReason, setRetireReason] = useState('End of standard useful hardware lifespan');
  const [retireNotes, setRetireNotes] = useState('');

  // Disposal form
  const [disposalMethod, setDisposalMethod] = useState('Certified E-Waste Recycling (ISO 14001)');
  const [disposalCost, setDisposalCost] = useState('150');
  const [disposalNotes, setDisposalNotes] = useState('Data sanitized per NIST SP 800-88 guidelines.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'RETIRE') {
        const res = await assetService.retireAsset(asset._id, {
          reason: retireReason,
          notes: retireNotes,
        });
        if (res.success) {
          toast.success(`Asset ${asset.assetId} successfully retired.`);
          onClose();
          if (onComplete) onComplete(res.data);
        }
      } else {
        const res = await assetService.disposeAsset(asset._id, {
          method: disposalMethod,
          cost: disposalCost,
          notes: disposalNotes,
        });
        if (res.success) {
          toast.success(`Asset ${asset.assetId} permanently disposed.`);
          onClose();
          if (onComplete) onComplete(res.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'RETIRE' ? 'Decommission & Retire Asset' : 'Certified E-Waste Disposal'}
      subtitle={`Milestone lifecycle transition for ${asset?.name} (${asset?.assetId})`}
      maxWidth="max-w-lg"
    >
      <div className="mb-4 flex rounded-xl bg-slate-100 dark:bg-surface-dark p-1 border border-slate-200 dark:border-surface-darkBorder">
        <button
          type="button"
          onClick={() => setMode('RETIRE')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            mode === 'RETIRE'
              ? 'bg-white dark:bg-surface-darkCard text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Retire Asset
        </button>
        <button
          type="button"
          onClick={() => setMode('DISPOSE')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
            mode === 'DISPOSE'
              ? 'bg-white dark:bg-surface-darkCard text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Final Disposal
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'RETIRE' ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Decommissioning Reason
              </label>
              <select
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="End of standard useful hardware lifespan">End of standard useful hardware lifespan</option>
                <option value="Hardware failure beyond economical repair">Hardware failure beyond economical repair</option>
                <option value="Architectural obsolescence / Tech upgrade">Architectural obsolescence / Tech upgrade</option>
                <option value="Vendor EOSL (End of Service Life)">Vendor EOSL (End of Service Life)</option>
                <option value="Contract expiration / Lease return">Contract expiration / Lease return</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Retirement Audit Notes
              </label>
              <textarea
                rows={3}
                value={retireNotes}
                onChange={(e) => setRetireNotes(e.target.value)}
                placeholder="Log wiping confirmation, asset tag removal, storage location in decommission warehouse..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Disposal Method & Vendor
              </label>
              <input
                type="text"
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
                placeholder="e.g. Certified E-Waste Recycling (ISO 14001)"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Disposal / Destruction Cost ($)
              </label>
              <input
                type="number"
                value={disposalCost}
                onChange={(e) => setDisposalCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Environmental & Compliance Certification Notes
              </label>
              <textarea
                rows={3}
                value={disposalNotes}
                onChange={(e) => setDisposalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
              />
            </div>
          </>
        )}

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-colors ${
              mode === 'RETIRE'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {mode === 'RETIRE' ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            {submitting ? 'Processing...' : mode === 'RETIRE' ? 'Confirm Retirement' : 'Authorize Permanent Disposal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
