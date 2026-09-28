import React, { useState } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Shield,
  Bell,
  Cpu,
  Database,
  CheckCircle2,
  PlayCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name, phone });
      if (res.success && res.data) {
        updateUserProfile(res.data);
        toast.success('Profile updated successfully.');
      }
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Settings &amp; Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize interface appearance, operator profile, and review platform architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile & Appearance */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Operator Profile Details
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-surface-dark/50 border border-slate-200 dark:border-surface-darkBorder text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Assigned Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.role || 'TECHNICIAN'}
                    className="w-full px-3.5 py-2 rounded-xl text-xs font-bold font-mono text-champagne-600 dark:text-champagne-400 bg-slate-100 dark:bg-surface-dark/50 border border-slate-200 dark:border-surface-darkBorder outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-sm transition-colors"
                >
                  {saving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Theme & Appearance Card */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-6 shadow-subtle space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder flex items-center gap-2">
              <Sun className="w-4 h-4 text-champagne-500" />
              Interface Theme &amp; Color Scheme
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  Dark Mode / Light Mode
                </p>
                <p className="text-[11px] text-slate-400">
                  Current theme is set to <span className="font-semibold uppercase">{theme}</span> (Persisted in browser storage).
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-surface-dark hover:border-emerald-500 transition-colors"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-champagne-400" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-600" /> Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Telemetry & Hackathon Story */}
        <div className="space-y-6">
          {/* System Specs */}
          <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-5 shadow-subtle space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-surface-darkBorder flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Engine Architecture
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400">Application:</span>
                <span className="font-bold text-slate-800 dark:text-white">Infraro v1.0 Enterprise</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400">Frontend Stack:</span>
                <span className="text-slate-700 dark:text-slate-200">React + Vite + Tailwind CSS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400">Backend API:</span>
                <span className="text-slate-700 dark:text-slate-200">Express.js REST + Mongoose</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-surface-darkBorder">
                <span className="text-slate-400">Database:</span>
                <span className="text-slate-700 dark:text-slate-200 font-mono">MongoDB (Port 27017)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Visual Palette:</span>
                <span className="text-emerald-700 dark:text-champagne-300 font-semibold">Emerald Ink + Champagne</span>
              </div>
            </div>
          </div>

          {/* Hackathon Demo Flow Cheat Sheet */}
          <div className="bg-emeraldInk-950 text-white rounded-2xl p-5 shadow-premium border border-emeraldInk-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-champagne-300 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-champagne-400" />
              Demo Flow Walkthrough
            </h3>
            <ol className="space-y-2 text-[11px] text-slate-300 list-decimal list-inside">
              <li>Login as Admin (<span className="text-champagne-300">admin@infraro.com</span>)</li>
              <li>Inspect KPI stats, charts, &amp; replacement recommendations</li>
              <li>Search for demo asset <span className="font-mono text-champagne-300 font-bold">SRV-000124</span></li>
              <li>View complete lifecycle timeline &amp; rule-based scores</li>
              <li>Generate QR Code, simulate print &amp; scan</li>
              <li>Open new maintenance ticket; update status &amp; cost</li>
              <li>Demonstrate automatic lifecycle history &amp; score re-calculation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
