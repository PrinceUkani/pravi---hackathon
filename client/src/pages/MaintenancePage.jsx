import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Plus, Search, Filter, Calendar, Clock, DollarSign } from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { userService } from '../services/infrastructureService';
import { TicketStatusBadge, TicketPriorityBadge } from '../components/maintenance/TicketStatusBadge';
import { MaintenanceFormModal } from '../components/maintenance/MaintenanceFormModal';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const MaintenancePage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [techFilter, setTechFilter] = useState('');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        technician: techFilter || undefined,
      };
      const res = await maintenanceService.getTickets(params);
      if (res.success) {
        setTickets(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load maintenance tickets.');
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
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, techFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchTickets, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Maintenance &amp; Engineering Tickets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch diagnostic repairs, track preventive maintenance cycles, and log component replacement costs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Maintenance Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, issue, desc..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div>
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
            >
              <option value="">All Technicians</option>
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={6} />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No maintenance tickets found"
            description="All scheduled maintenance and unexpected repair dispatches are currently clear."
            actionLabel="Open Service Ticket"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-surface-darkBorder">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Target Asset</th>
                  <th className="py-3 px-4">Issue Description</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/maintenance/${t._id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-surface-darkHover cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emeraldInk-800 dark:text-champagne-300">
                      {t.ticketId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                        {t.asset?.name || 'Asset removed'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {t.asset?.assetId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {t.issue}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <TicketPriorityBadge priority={t.priority} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {t.assignedTechnician ? t.assignedTechnician.name : <span className="text-slate-400">Unassigned</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(t.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <TicketStatusBadge status={t.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      ${(t.actualCost || t.estimatedCost || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MaintenanceFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTicketCreated={() => {
          setIsCreateModalOpen(false);
          fetchTickets();
        }}
      />
    </div>
  );
};
