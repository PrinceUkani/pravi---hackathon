import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { Modal } from '../common/Modal';
import { maintenanceService } from '../../services/maintenanceService';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/infrastructureService';
import toast from 'react-hot-toast';

export const MaintenanceFormModal = ({ isOpen, onClose, preselectedAsset, onTicketCreated }) => {
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    issue: '',
    description: '',
    priority: 'MEDIUM',
    assignedTechnician: '',
    dueDate: '',
    estimatedCost: '0',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        assetId: preselectedAsset?._id || '',
        issue: '',
        description: '',
        priority: 'MEDIUM',
        assignedTechnician: '',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedCost: '0',
      });

      const fetchOptions = async () => {
        setLoading(true);
        try {
          const [userRes, assetRes] = await Promise.all([
            userService.getUsers(),
            !preselectedAsset ? assetService.getAssets({ limit: 50, status: 'ACTIVE' }) : Promise.resolve({ data: { assets: [] } }),
          ]);
          setTechnicians((userRes.data || []).filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
          if (!preselectedAsset && assetRes.data?.assets) {
            setAssets(assetRes.data.assets);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchOptions();
    }
  }, [isOpen, preselectedAsset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId) {
      toast.error('Please select an asset.');
      return;
    }
    if (!formData.issue.trim()) {
      toast.error('Please enter the issue title.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await maintenanceService.createTicket(formData);
      if (res.success) {
        toast.success(`Maintenance ticket ${res.data.ticketId} created!`);
        onClose();
        if (onTicketCreated) onTicketCreated(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Maintenance Ticket"
      subtitle={preselectedAsset ? `Initiating ticket for ${preselectedAsset.name} (${preselectedAsset.assetId})` : 'Dispatch technician service or preventive repair'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset selection if not preselected */}
        {!preselectedAsset && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Target Infrastructure Asset *
            </label>
            <select
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">Select Asset...</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.assetId} — {a.name} ({a.brand})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Issue Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Issue Title / Summary *
          </label>
          <input
            type="text"
            required
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            placeholder="e.g. Redundant PSU 2 voltage fluctuation alert"
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>

        {/* Priority & Assigned Technician */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="LOW">Low (Preventive/Routine)</option>
              <option value="MEDIUM">Medium (Degraded Performance)</option>
              <option value="HIGH">High (SLA Risk)</option>
              <option value="CRITICAL">Critical (Hardware Outage)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Assign Technician
            </label>
            <select
              value={formData.assignedTechnician}
              onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">Unassigned (NOC Pool)</option>
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Estimated Cost */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Service Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Estimated Cost ($)
            </label>
            <input
              type="number"
              min="0"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Technical Problem Description & Diagnostic Logs
          </label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed symptoms, sensor readings, failure error codes, part numbers required..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-surface-darkBorder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darkHover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            {submitting ? 'Generating Ticket...' : 'Open Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
