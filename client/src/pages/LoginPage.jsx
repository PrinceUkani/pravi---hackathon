import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Server, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    toast.success(`Loaded credentials for ${demoEmail.split('@')[0].toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-surface-dark px-4 py-12 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-champagne-500/10 dark:bg-champagne-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emeraldInk-950 text-white shadow-emerald-glow mb-4 border border-emerald-500/30">
            <span className="text-2xl font-black tracking-wider text-champagne-300">I</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            INFRARO
          </h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-emeraldInk-800 dark:text-champagne-400 mt-1">
            Manage Every Asset. Track Every Lifecycle.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-surface-darkCard rounded-2xl border border-slate-200/90 dark:border-surface-darkBorder p-8 shadow-xl">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Sign In to Console
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Enter your enterprise credentials to access infrastructure assets.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@infraro.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-darkBorder text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 outline-none pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emeraldInk-900 hover:bg-emeraldInk-950 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Infrastructure'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Credentials Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-surface-darkBorder">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Demo Logins (Hackathon Mode)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@infraro.com', 'Admin@123')}
                className="p-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-surface-dark hover:border-emerald-500 text-center transition-all group"
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                  Admin
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('manager@infraro.com', 'Manager@123')}
                className="p-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-surface-dark hover:border-emerald-500 text-center transition-all group"
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                  Manager
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('tech@infraro.com', 'Tech@123')}
                className="p-2 rounded-xl border border-slate-200 dark:border-surface-darkBorder bg-slate-50 dark:bg-surface-dark hover:border-emerald-500 text-center transition-all group"
              >
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                  Tech
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">QR &amp; Work</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
