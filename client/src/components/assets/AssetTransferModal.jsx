import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { locationService, departmentService, userService } from '../../services/infrastructureService';
import { assetService } from '../../services/assetService';
import toast from 'react-hot-toast';

export const AssetTransferModal = ({ isOpen, onClose, asset, onTransferred }) => {
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    locationId: '',
    departmentId: '',
    assignedToId: '',
    transferNotes: '',
  });

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        locationId: asset.location?._id || asset.location || '',
        departmentId: asset.department?._id || asset.department || '',
        assignedToId: asset.assignedTo?._id || asset.assignedTo || '',
        transferNotes: '',
      });

      const fetchOptions = async () => {
        setLoading(true);
        try {
          const [locRes, deptRes, userRes] = await Promise.all([
            locationService.getLocations(),
            departmentService.getDepartments(),
            userService.getUsers(),
          ]);
          setLocations(locRes.data || []);
          setDepartments(deptRes.data || []);
          setUsers(userRes.data || []);
        } catch (err) {
          toast.error('Failed to load transfer destinations.');
        } finally {
          setLoading(false);
        }
      };

      fetchOptions();
    }
  }, [isOpen, asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await assetService.transferAsset(asset._id, formData);
      if (res.success) {
        toast.success(`Asset ${asset.assetId} successfully transferred!`);
        onClose();
        if (onTransferred) onTransferred(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer & Reassign Asset"
      subtitle={`Move ${asset?.name} (${asset?.assetId}) across facility, department or employee`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Destination Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Physical Location
          </label>
          <select
            value={formData.locationId}
            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none"
          >
            <option value="">Select Location...</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>
                {loc.building} — {loc.room || loc.floor} {loc.rack ? `(${loc.rack})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Destination Department */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Owning Department
          </label>
          <select
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none"
          >
            <option value="">Select Department...</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {/* Responsible Employee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Assigned Custodian / Operator
          </label>
          <select
            value={formData.assignedToId}
            onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none"
          >
            <option value="">Unassigned / Shared Resource</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email} — {u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Transfer Rationale / Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Transfer Justification / Notes
          </label>
          <textarea
            rows={3}
            value={formData.transferNotes}
            onChange={(e) => setFormData({ ...formData, transferNotes: e.target.value })}
            placeholder="Reason for transfer (e.g. rack consolidation, new team assignment, replacement rollout)..."
            className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none resize-none"
          />
        </div>

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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
            {submitting ? 'Executing Transfer...' : 'Complete Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
