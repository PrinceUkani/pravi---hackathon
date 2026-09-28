import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Wrench,
  MapPin,
  Building2,
  Store,
  BarChart3,
  ScanLine,
  Users,
  ClipboardList,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isManager } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Asset Inventory', path: '/assets', icon: Boxes },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'QR Scanner', path: '/qr-scanner', icon: ScanLine },
    { label: 'Locations', path: '/locations', icon: MapPin },
    { label: 'Departments', path: '/departments', icon: Building2 },
    { label: 'Vendors', path: '/vendors', icon: Store },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    ...(isManager ? [{ label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList }] : []),
    ...(isAdmin ? [{ label: 'User Directory', path: '/users', icon: Users }] : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-emeraldInk-950 text-slate-100 flex flex-col border-r border-emeraldInk-900/60 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-emeraldInk-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-emerald-glow text-white font-black text-xl tracking-wider border border-emerald-400/30">
              I
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                INFRARO
                <span className="w-1.5 h-1.5 rounded-full bg-champagne-400"></span>
              </h1>
              <p className="text-[10px] text-emerald-300/70 font-medium tracking-wider uppercase">
                Enterprise Lifecycle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emeraldInk-900/80 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/50">
            Platform Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emeraldInk-900 text-white font-semibold border-l-4 border-champagne-400 shadow-sm'
                      : 'text-emerald-100/70 hover:text-white hover:bg-emeraldInk-900/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-emerald-300/80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Role Card at Bottom */}
        <div className="p-4 border-t border-emeraldInk-900/60 bg-emeraldInk-950/80">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emeraldInk-900/50 border border-emeraldInk-800/40">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-champagne-300 flex items-center justify-center font-bold text-sm border border-champagne-500/20">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Infraro User'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-champagne-400" />
                <span className="text-[10px] font-bold text-champagne-400 tracking-wider uppercase">
                  {user?.role || 'TECHNICIAN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
