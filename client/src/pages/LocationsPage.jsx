import React, { useState, useEffect } from 'react';
import { MapPin, Plus, DollarSign, Boxes, Wrench, Building } from 'lucide-react';
import { locationService } from '../services/infrastructureService';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    building: '',
    floor: 'Floor 1',
    room: '',
    rack: '',
    address: '',
    description: '',
  });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await locationService.getLocations();
      if (res.success) {
        setLocations(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.building.trim()) return;

    setSubmitting(true);
    try {
      const res = await locationService.createLocation(formData);
      if (res.success) {
        toast.success(`Location ${formData.building} added.`);
        setIsModalOpen(false);
        setFormData({ building: '', floor: 'Floor 1', room: '', rack: '', address: '', description: '' });
        fetchLocations();
      }
    } catch (err) {
      toast.error('Failed to create location.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Facility &amp; Location Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data centers, server rooms, rack enclosures, and campus infrastructure hubs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Facility Location
        </button>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : locations.length === 0 ? (
        <EmptyState
          title="No locations configured"
          description="Add physical campuses, data halls, or rack enclosures to track asset placements."
          actionLabel="Add First Facility"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/60 text-emerald-700 dark:text-emerald-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {loc.building}
                      </h3>
                      <p className="text-xs text-slate-400">{loc.floor} &bull; {loc.room || 'General'}</p>
                    </div>
                  </div>
                  {loc.rack && (
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-dark text-slate-700 dark:text-slate-300">
                      {loc.rack}
                    </span>
                  )}
                </div>

                {loc.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                    {loc.address}
                  </p>
                )}
              </div>

              {/* Stats Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-surface-darkBorder grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assets</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{loc.assetCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Active</span>
                  <span className="font-bold text-emerald-600">{loc.activeCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Value</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
                    ${((loc.totalValue || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Facility Location"
        subtitle="Register campus building, room, or rack enclosure"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Building / Campus *
            </label>
            <input
              type="text"
              required
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              placeholder="e.g. Ahmedabad HQ, Mumbai DC"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Floor
              </label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="e.g. Basement 1, Floor 2"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Room / Hall
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g. Server Room DC-1"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Rack / Enclosure Tag
            </label>
            <input
              type="text"
              value={formData.rack}
              onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
              placeholder="e.g. Rack R01, Cage C-04"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Postal Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Physical street address"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-surface-darkBorder">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm"
            >
              {submitting ? 'Adding...' : 'Create Location'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
