import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../api/client';
import { Lock, Mail, Server, Check, ChevronRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@planotech.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrlInput] = useState(getApiBaseUrl());
  const [serverSaved, setServerSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleQuickLogin = (role) => {
    const creds = role === 'admin'
      ? { e: 'admin@planotech.com', p: 'admin123' }
      : { e: 'viewer@planotech.com', p: 'viewer123' };
    setEmail(creds.e);
    setPassword(creds.p);
    login(creds.e, creds.p);
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
              alt="Planotech"
              className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#080c1a' }}
            />
            <div>
              <h1 className="text-lg font-black text-white tracking-wide">PLANOTECH</h1>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#f59e0b' }}>HR Intelligence Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Smarter HR<br />
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
              alt="Planotech"
              className="w-9 h-9 rounded-xl object-contain flex-shrink-0"
              style={{ background: '#080c1a' }}
            />
            <div>
              <h1 className="text-base font-black text-white">PLANOTECH</h1>
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#f59e0b' }}>HR Intelligence</p>
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

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm text-rose-300 flex items-start gap-2" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
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
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2.5 text-center">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="py-2 rounded-lg text-xs font-semibold transition"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}
                >
                  Admin Demo
                </button>
                <button
                  onClick={() => handleQuickLogin('viewer')}
                  className="py-2 rounded-lg text-xs font-semibold transition"
                  style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8' }}
                >
                  Viewer Demo
                </button>
              </div>
            </div>

            {/* Server Config */}
            <div className="mt-4">
              <button
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
                    placeholder="https://your-backend.onrender.com"
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
    </div>
  );
};

export default Login;
