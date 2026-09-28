import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { userService } from '../services/infrastructureService';
import { useAuth } from '../context/AuthContext';
import { TicketStatusBadge, TicketPriorityBadge } from '../components/maintenance/TicketStatusBadge';
import toast from 'react-hot-toast';

export const MaintenanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isTechnician, isAdmin } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status & resolution update state
  const [newStatus, setNewStatus] = useState('');
  const [actualCost, setActualCost] = useState('0');
  const [resolution, setResolution] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New comment
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const res = await maintenanceService.getTicketById(id);
      if (res.success && res.data) {
        setTicket(res.data);
        setNewStatus(res.data.status);
        setActualCost(String(res.data.actualCost || res.data.estimatedCost || 0));
        setResolution(res.data.resolution || '');
        setSelectedTech(res.data.assignedTechnician?._id || '');
      }
    } catch (err) {
      toast.error('Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTechs = async () => {
      try {
        const res = await userService.getUsers();
        setTechnicians((res.data || []).filter((u) => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
      } catch (err) {
        console.error(err);
      }
    };
    loadTechs();
    fetchTicket();
  }, [id]);

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload = {
        status: newStatus,
        actualCost: Number(actualCost) || 0,
        resolution,
        assignedTechnician: selectedTech || null,
      };
      const res = await maintenanceService.updateTicket(ticket._id, payload);
      if (res.success) {
        toast.success(`Ticket ${ticket.ticketId} updated successfully.`);
        fetchTicket();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await maintenanceService.addComment(ticket._id, commentText);
      if (res.success) {
        toast.success('Work log note added.');
        setCommentText('');
        fetchTicket();
      }
    } catch (err) {
      toast.error('Failed to append work log note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500">Loading service ticket details...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-base font-bold text-slate-800 dark:text-white">Ticket Not Found</h2>
        <button
          onClick={() => navigate('/maintenance')}
          className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-emeraldInk-900 text-white"
        >
          Return to Maintenance
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/maintenance')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Maintenance List
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emeraldInk-800 dark:text-champagne-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emeraldInk-950 border border-emerald-200 dark:border-emerald-800">
                {ticket.ticketId}
              </span>
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {ticket.issue}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Asset Information Card */}
          {ticket.asset && (
            <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-surface-darkBorder mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Infrastructure Asset
                </span>
                <button
                  onClick={() => navigate(`/assets/${ticket.asset.assetId}`)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View Asset <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Asset ID:</span>
                  <p className="font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                    {ticket.asset.assetId}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Name:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {ticket.asset.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Brand / Model:</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    {ticket.asset.brand} &bull; {ticket.asset.model}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Facility Location:</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    {ticket.asset.location?.building} — {ticket.asset.location?.room || ticket.asset.location?.floor}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Current Status:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {ticket.asset.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description & Technical Findings */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Problem Description &amp; Diagnostic Logs
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {ticket.description}
            </p>

            {ticket.resolution && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emeraldInk-950/60 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                  Recorded Resolution Note
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {ticket.resolution}
                </p>
              </div>
            )}
          </div>

          {/* Technician Field Log & Comments */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
              Service Notes &amp; Field Comments ({ticket.comments?.length || 0})
            </h3>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {ticket.comments?.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No field notes added yet.</p>
              ) : (
                ticket.comments.map((c, idx) => (
                  <div
                    key={c._id || idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-surface-darkBorder text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.authorName || c.author?.name || 'Technician'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {c.comment}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add note form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Log diagnostic test results, spare parts used, sensor readings..."
                className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Workflow Status Transition & Cost Tracking */}
        <div className="space-y-6">
          <form
            onSubmit={handleUpdateTicket}
            className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder">
              Workflow Status &amp; Resolution
            </h3>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Ticket Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="OPEN">OPEN (Unstarted)</option>
                <option value="ASSIGNED">ASSIGNED (Technician Dispatched)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Under Service)</option>
                <option value="ON_HOLD">ON_HOLD (Awaiting Spare Parts)</option>
                <option value="RESOLVED">RESOLVED (Restores Asset to ACTIVE)</option>
                <option value="CLOSED">CLOSED (Finalized &amp; Billed)</option>
              </select>
              {newStatus === 'IN_PROGRESS' && (
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  &bull; Asset status will automatically switch to MAINTENANCE.
                </p>
              )}
              {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                  &bull; Asset will return to ACTIVE and recalculate health score.
                </p>
              )}
            </div>

            {/* Assigned Tech */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Assigned Lead Technician
              </label>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              >
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Actual Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Actual Incurred Repair Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Estimated: ${(ticket.estimatedCost || 0).toLocaleString()}
              </p>
            </div>

            {/* Resolution Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Engineering Resolution Summary
              </label>
              <textarea
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe parts replaced, firmware flashed, or stress test results..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-md transition-colors"
            >
              {isUpdating ? 'Saving Workflow State...' : 'Save Workflow Transition'}
            </button>
          </form>

          {/* Ticket Metadata Card */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
              <span className="text-slate-400">Reported By:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {ticket.reportedBy?.name || 'System Operator'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
              <span className="text-slate-400">Opened Date:</span>
              <span className="text-slate-600 dark:text-slate-300">
                {new Date(ticket.createdDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
              <span className="text-slate-400">Service Due Date:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {new Date(ticket.dueDate).toLocaleDateString()}
              </span>
            </div>
            {ticket.resolvedDate && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Resolved Date:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {new Date(ticket.resolvedDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
