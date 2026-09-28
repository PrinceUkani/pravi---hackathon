import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, DollarSign, Boxes, Wrench } from 'lucide-react';
import { departmentService, userService } from '../services/infrastructureService';
import { Modal } from '../components/common/Modal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    manager: '',
    description: '',
  });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        departmentService.getDepartments(),
        userService.getUsers(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (userRes.success) setManagers((userRes.data || []).filter((u) => u.role !== 'TECHNICIAN'));
    } catch (err) {
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await departmentService.createDepartment(formData);
      if (res.success) {
        toast.success(`Department ${formData.name} created.`);
        setIsModalOpen(false);
        setFormData({ name: '', code: '', manager: '', description: '' });
        fetchDepartments();
      }
    } catch (err) {
      toast.error('Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Department Management &amp; Asset Ownership
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track hardware allocation, budgets, and responsible leads across corporate divisions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create your organizational departments to assign asset custody."
          actionLabel="Add Department"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle hover:border-emerald-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/60 text-emerald-700 dark:text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-dark text-slate-700 dark:text-slate-300">
                    {dept.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manager: <span className="font-medium text-slate-600 dark:text-slate-200">{dept.manager?.name || 'Unassigned'}</span>
                </p>

                {dept.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {dept.description}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-surface-darkBorder grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Assets</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{dept.assetCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Hardware Value</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    ${((dept.totalValue || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Department"
        subtitle="Create organizational unit for asset allocation"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Cybersecurity, Engineering & DevOps"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Department Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SEC-OPS, IT-INF"
              className="w-full px-3 py-2 rounded-xl text-xs font-mono uppercase bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Lead Manager
            </label>
            <select
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">Select Manager...</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary responsibilities and systems owned..."
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
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
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
