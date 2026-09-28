import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Boxes, ArrowLeft, Save, Shield } from 'lucide-react';
import { assetService } from '../services/assetService';
import {
  categoryService,
  locationService,
  departmentService,
  vendorService,
  userService,
} from '../services/infrastructureService';
import toast from 'react-hot-toast';

export const AssetFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      category: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      assetTag: '',
      vendor: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: 0,
      warrantyStart: new Date().toISOString().split('T')[0],
      warrantyExpiry: '',
      warrantyProvider: '',
      warrantyType: 'Standard',
      location: '',
      department: '',
      assignedTo: '',
      condition: 'GOOD',
      status: 'ACTIVE',
      description: '',
      replacementCost: 0,
      maintenanceIntervalDays: 90,
    },
  });

  const selectedCategory = watch('category');

  // Load lookup options
  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true);
      try {
        const [catRes, locRes, deptRes, venRes, userRes] = await Promise.all([
          categoryService.getCategories(),
          locationService.getLocations(),
          departmentService.getDepartments(),
          vendorService.getVendors(),
          userService.getUsers(),
        ]);
        setCategories(catRes.data || []);
        setLocations(locRes.data || []);
        setDepartments(deptRes.data || []);
        setVendors(venRes.data || []);
        setUsers(userRes.data || []);

        // If editing, load current asset
        if (isEditing) {
          const assetRes = await assetService.getAssetById(id);
          if (assetRes.success && assetRes.data?.asset) {
            const a = assetRes.data.asset;
            setValue('name', a.name);
            setValue('category', a.category?._id || a.category || '');
            setValue('type', a.type || '');
            setValue('brand', a.brand);
            setValue('model', a.model);
            setValue('serialNumber', a.serialNumber);
            setValue('assetTag', a.assetTag || '');
            setValue('vendor', a.vendor?._id || a.vendor || '');
            setValue('purchaseDate', a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : '');
            setValue('purchaseCost', a.purchaseCost);
            setValue('warrantyStart', a.warrantyStart ? new Date(a.warrantyStart).toISOString().split('T')[0] : '');
            setValue('warrantyExpiry', a.warrantyExpiry ? new Date(a.warrantyExpiry).toISOString().split('T')[0] : '');
            setValue('warrantyProvider', a.warrantyProvider || '');
            setValue('warrantyType', a.warrantyType || 'Standard');
            setValue('location', a.location?._id || a.location || '');
            setValue('department', a.department?._id || a.department || '');
            setValue('assignedTo', a.assignedTo?._id || a.assignedTo || '');
            setValue('condition', a.condition || 'GOOD');
            setValue('status', a.status || 'ACTIVE');
            setValue('description', a.description || '');
            setValue('replacementCost', a.replacementCost || a.purchaseCost || 0);
            setValue('maintenanceIntervalDays', a.maintenanceIntervalDays || 90);
          }
        }
      } catch (err) {
        toast.error('Failed to load form options.');
      } finally {
        setLoading(false);
      }
    };

    loadLookups();
  }, [id, isEditing, setValue]);

  // Set default warranty expiry to 3 years from purchase date automatically if empty
  const purchaseDateValue = watch('purchaseDate');
  useEffect(() => {
    if (purchaseDateValue && !isEditing) {
      const p = new Date(purchaseDateValue);
      p.setFullYear(p.getFullYear() + 3);
      setValue('warrantyExpiry', p.toISOString().split('T')[0]);
    }
  }, [purchaseDateValue, isEditing, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await assetService.updateAsset(id, data);
        if (res.success) {
          toast.success(`Asset ${res.data.assetId} updated successfully.`);
          navigate(`/assets/${res.data.assetId}`);
        }
      } else {
        const res = await assetService.createAsset(data);
        if (res.success) {
          toast.success(`Asset ${res.data.assetId} registered successfully!`);
          navigate(`/assets/${res.data.assetId}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Form submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        Loading infrastructure registry schema...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isEditing ? 'Modify Infrastructure Asset' : 'Register New Infrastructure Asset'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fill in hardware parameters, warranty coverage, location assignment, and lifecycle telemetry.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECTION 1: Hardware Identification */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
            1. Equipment Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Asset Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Asset Name is required' })}
                placeholder="e.g. Dell PowerEdge R740 Server"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-[11px] text-rose-500 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                {...register('brand', { required: 'Brand is required' })}
                placeholder="e.g. Dell, Cisco, HP"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
              {errors.brand && <p className="text-[11px] text-rose-500 mt-1">{errors.brand.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Model Number / Spec *
              </label>
              <input
                type="text"
                {...register('model', { required: 'Model is required' })}
                placeholder="e.g. PowerEdge R740 2U"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
              {errors.model && <p className="text-[11px] text-rose-500 mt-1">{errors.model.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Hardware Serial Number *
              </label>
              <input
                type="text"
                {...register('serialNumber', { required: 'Serial number is required' })}
                placeholder="Unique manufacturer serial number"
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
              {errors.serialNumber && <p className="text-[11px] text-rose-500 mt-1">{errors.serialNumber.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Physical Asset Tag / Barcode
              </label>
              <input
                type="text"
                {...register('assetTag')}
                placeholder="TAG-..."
                className="w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Financial & Procurement */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
            2. Procurement &amp; Financials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Purchase Cost ($) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                {...register('purchaseCost', { required: 'Purchase Cost is required' })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Purchase Date *
              </label>
              <input
                type="date"
                {...register('purchaseDate', { required: 'Purchase date is required' })}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Vendor Partner
              </label>
              <select
                {...register('vendor')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">Select Vendor...</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Warranty Coverage */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
            3. Warranty &amp; SLA Coverage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Warranty Expiry Date
              </label>
              <input
                type="date"
                {...register('warrantyExpiry')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Warranty Provider
              </label>
              <input
                type="text"
                {...register('warrantyProvider')}
                placeholder="e.g. Dell ProSupport Plus"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                SLA Service Type
              </label>
              <select
                {...register('warrantyType')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="Standard">Standard (Return to depot)</option>
                <option value="OEM 24x7 Mission Critical">OEM 24x7 Mission Critical</option>
                <option value="Extended On-Site SLA">Extended On-Site 4hr SLA</option>
                <option value="Third Party Support">Third Party AMC</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 4: Location, Assignment & Condition */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
            4. Deployment &amp; Initial Condition
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Location
              </label>
              <select
                {...register('location')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">Select Location...</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.building} — {l.room || l.floor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Department
              </label>
              <select
                {...register('department')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Condition
              </label>
              <select
                {...register('condition')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Initial Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="ACTIVE">Active</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="INSTALLED">Installed</option>
                <option value="PROCUREMENT">Procurement</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Assigned Employee Custodian
            </label>
            <select
              {...register('assignedTo')}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">Unassigned (Shared Data Center Pool)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email} — {u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Operational Purpose &amp; Workload Notes
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Primary workloads hosted, redundant power feeds, special network configs..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-surface-darkBorder text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-darkHover transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Registering...' : isEditing ? 'Save Updates' : 'Complete Asset Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};
