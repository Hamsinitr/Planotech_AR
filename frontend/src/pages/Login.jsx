import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../api/client';
import api from '../api/client';
import {
  Lock,
  Mail,
  Server,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const Login = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@hontime.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Forgot / Reset Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrlInput] = useState(getApiBaseUrl());
  const [serverSaved, setServerSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const res = await login(cleanEmail, cleanPassword);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setInfoMessage('');
    const creds = role === 'admin'
      ? { e: 'admin@hontime.com', p: 'admin123' }
      : { e: 'viewer@hontime.com', p: 'viewer123' };
    setEmail(creds.e);
    setPassword(creds.p);
    const res = await login(creds.e, creds.p);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleOpenForgotModal = () => {
    setResetEmail(email.trim() || 'admin@hontime.com');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setShowForgotModal(true);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your account email.');
      return;
    }
    if (resetNewPassword.length < 4) {
      setResetError('New password must be at least 4 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: resetEmail.trim(),
        new_password: resetNewPassword.trim(),
        confirm_password: resetConfirmPassword.trim(),
      });

      setResetSuccess(res.data.message || 'Password updated successfully!');
      setEmail(resetEmail.trim());
      setPassword(resetNewPassword.trim());
      setInfoMessage('Password reset complete. You can now sign in.');
      setTimeout(() => {
        setShowForgotModal(false);
      }, 1500);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Failed to update password. Please check email address.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRestoreDefaultAdmin = async () => {
    setResetError('');
    setResetSuccess('');
    setResetLoading(true);
    try {
      const res = await api.post('/auth/restore-default-admin');
      setResetSuccess(res.data.message || 'Default admin password reset to admin123!');
      setEmail('admin@hontime.com');
      setPassword('admin123');
      setInfoMessage('Default credentials restored: admin@hontime.com / admin123');
      setTimeout(() => {
        setShowForgotModal(false);
      }, 1500);
    } catch (err) {
      setResetError(err.response?.data?.detail || 'Unable to restore default credentials.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSaveServerUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(serverUrl);
    setServerSaved(true);
    setTimeout(() => setServerSaved(false), 2000);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #080c1a 0%, #0d1424 50%, #111b30 100%)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-16">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: '#3b82f6' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: '#8b5cf6' }} />

        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <img
              src="/logo.png"
              alt="Hontime"
              className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#080c1a' }}
            />
            <div>
              <h1 className="text-lg font-black text-white tracking-wide">HONTIME</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#f59e0b' }}>Attendance & Operations Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Smarter Operations<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Analytics.
            </span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Real-time attendance tracking, report submission compliance, productivity scoring, and automated reconciliation — all in one place.
          </p>

          <div className="space-y-3">
            {[
              { label: 'Daily attendance classification & punch-in analysis' },
              { label: 'Report quality scoring & submission compliance' },
              { label: 'Automated 9-sheet Excel export' },
              { label: 'Historical trends & department analytics' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Check className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <span className="text-sm text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        {/* Mobile glow */}
        <div className="lg:hidden absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: '#3b82f6' }} />

        <div className="w-full max-w-md relative">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img
              src="/logo.png"
              alt="Hontime"
              className="w-9 h-9 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#080c1a' }}
            />
            <div>
              <h1 className="text-base font-black text-white">HONTIME</h1>
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#f59e0b' }}>Attendance & Operations</p>
            </div>
          </div>

          {/* Login Card */}
          <div
            className="rounded-2xl p-8 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Sign in to your account</h3>
              <p className="text-sm text-slate-400 mt-1">Enter your credentials to access the portal</p>
            </div>

            {infoMessage && (
              <div className="mb-4 p-3 rounded-lg text-sm text-emerald-300 flex items-start gap-2" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm text-rose-300 flex items-start gap-2" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <p>{error}</p>
                  <p className="text-xs text-rose-400/80 mt-1">
                    Forgot your credentials? Click <button type="button" onClick={handleOpenForgotModal} className="underline font-semibold hover:text-white">Forgot password?</button> to reset.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@hontime.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none transition"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium transition hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white outline-none transition"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: loading ? '#334155' : 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 4px 20px rgba(37,99,235,0.35)' }}
              >
                {loading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>Sign In <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Quick Login */}
            <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2.5 text-center">One-Click Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="py-2.5 px-3 rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}
                >
                  <span>Admin Demo</span>
                  <span className="text-[10px] opacity-75 font-normal">admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('viewer')}
                  className="py-2.5 px-3 rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-0.5"
                  style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.22)', color: '#94a3b8' }}
                >
                  <span>Viewer Demo</span>
                  <span className="text-[10px] opacity-75 font-normal">viewer123</span>
                </button>
              </div>
            </div>

            {/* Server Config */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowServerConfig(!showServerConfig)}
                className="flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 transition w-full justify-center"
              >
                <Server className="w-3 h-3" />
                {showServerConfig ? 'Hide' : 'Configure'} API Server
              </button>

              {showServerConfig && (
                <form onSubmit={handleSaveServerUrl} className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    placeholder="http://localhost:8000/api"
                    className="w-full px-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}
                  >
                    {serverSaved ? <><Check className="w-3 h-3" /> Saved</> : 'Save API URL'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10"
            style={{ background: 'linear-gradient(145deg, #0d1527 0%, #111b33 100%)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-slate-400">Update account credentials or restore default</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-lg text-xs text-emerald-300 flex items-start gap-2 bg-emerald-950/50 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetError && (
              <div className="mb-4 p-3 rounded-lg text-xs text-rose-300 flex items-start gap-2 bg-rose-950/50 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 block">Account Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="admin@hontime.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 block">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    placeholder="At least 4 characters"
                    className="w-full pl-9 pr-9 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}
                >
                  {resetLoading ? 'Updating...' : 'Set New Password'}
                </button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">or instant reset</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  disabled={resetLoading}
                  onClick={handleRestoreDefaultAdmin}
                  className="w-full py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  Restore Default Admin (admin123)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
