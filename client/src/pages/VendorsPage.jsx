import React, { useState, useEffect } from 'react';
import { Store, Plus, Phone, Mail, Globe, DollarSign, Boxes, ExternalLink } from 'lucide-react';
import { vendorService } from '../services/infrastructureService';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorService.getVendors();
      if (res.success) {
        setVendors(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await vendorService.createVendor(formData);
      if (res.success) {
        toast.success(`Vendor ${formData.name} added.`);
        setIsModalOpen(false);
        setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', website: '' });
        fetchVendors();
      }
    } catch (err) {
      toast.error('Failed to create vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            OEM Vendor &amp; Supplier Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Original Equipment Manufacturers, hardware partners, SLA contacts, and procurement history.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vendor Partner
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="Register hardware manufacturers and suppliers to correlate procurement costs."
          actionLabel="Add First Vendor"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((v) => (
            <div
              key={v._id}
              className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/60 text-emerald-700 dark:text-emerald-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {v.name}
                      </h3>
                      {v.contactPerson && (
                        <p className="text-xs text-slate-400">Contact: {v.contactPerson}</p>
                      )}
                    </div>
                  </div>

                  {v.website && (
                    <a
                      href={v.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-surface-darkHover"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {v.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{v.email}</span>
                    </div>
                  )}
                  {v.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Procurement Footprint */}
              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-surface-darkBorder grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assets Procured</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{v.assetCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Spend</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ${((v.totalValue || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Vendor Partner"
        subtitle="Register equipment manufacturer or supplier"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Vendor / Manufacturer Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cisco Systems, Dell Technologies"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Account Manager"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Support Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-800-..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Support / Escalation Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="enterprise.support@vendor.com"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Official Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.vendor.com"
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
              {submitting ? 'Adding...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
