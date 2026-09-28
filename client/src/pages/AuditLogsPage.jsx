import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, ShieldCheck, Clock, User } from 'lucide-react';
import { auditService } from '../services/infrastructureService';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import toast from 'react-hot-toast';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        page,
        limit: 15,
        search: search.trim() || undefined,
        entity: entityFilter || undefined,
      });
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { total: 0, pages: 1, page: 1 });
      }
    } catch (err) {
      toast.error('Failed to load compliance audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Immutable Audit Trail &amp; Compliance Log
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident chronological audit records of all user actions, security logins, and hardware lifecycle state transitions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entity ID, action, user email, details..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="">All Entities</option>
          <option value="Asset">Asset</option>
          <option value="MaintenanceTicket">Maintenance Ticket</option>
          <option value="User">User</option>
          <option value="Location">Location</option>
          <option value="Department">Department</option>
          <option value="Vendor">Vendor</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit entries match query"
            description="The compliance audit trail is completely immutable and automatically records system actions."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-surface-dark text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-surface-darkBorder">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity &amp; Target ID</th>
                  <th className="py-3 px-4">Event Details &amp; State Delta</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-darkBorder">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-surface-darkHover transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                        {log.userName || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {log.userEmail || log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-surface-dark text-emeraldInk-800 dark:text-champagne-300 border border-slate-200 dark:border-surface-darkBorder">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{log.entity}</span>
                      <span className="font-mono text-[11px] text-slate-400 block">{log.entityId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-600 dark:text-slate-300 text-xs">{log.details}</p>
                      {(log.oldValue || log.newValue) && typeof log.newValue === 'object' && (
                        <div className="mt-1 text-[10px] font-mono text-slate-400">
                          State payload archived
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4">
              <Pagination
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={15}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
