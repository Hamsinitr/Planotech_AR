import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../api/client';
import { Lock, Mail, Shield, User, ArrowRight, Server, Settings, Check } from 'lucide-react';

export const Login = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@planotech.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  
  // Server Config State
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
    if (role === 'admin') {
      setEmail('admin@planotech.com');
      setPassword('admin123');
      login('admin@planotech.com', 'admin123');
    } else {
      setEmail('viewer@planotech.com');
      setPassword('viewer123');
      login('viewer@planotech.com', 'viewer123');
    }
  };

  const handleSaveServerUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(serverUrl);
    setServerSaved(true);
    setTimeout(() => setServerSaved(false), 2000);
  };

  const setPresetUrl = (url) => {
    setServerUrlInput(url);
    setApiBaseUrl(url);
    setServerSaved(true);
    setTimeout(() => setServerSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-blue-500/25">
            P
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          PLANOTECH
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-blue-400 uppercase tracking-widest">
          HR Analytics & Productivity Intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              {!loading && <ArrowRight className="ml-1.5 w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick Login Helper */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 text-center font-medium mb-3">Quick Demo Access:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin Role</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('viewer')}
                className="flex items-center justify-center space-x-1.5 py-2 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Viewer Role</span>
              </button>
            </div>
          </div>

          {/* Android / Mobile API Server Config */}
          <div className="mt-6 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              <span className="flex items-center space-x-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Backend Server Connection</span>
              </span>
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showServerConfig && (
              <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-2">
                <label className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  API Endpoint Base URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrlInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="http://192.168.1.xxx:8000/api"
                  />
                  <button
                    onClick={handleSaveServerUrl}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition flex items-center space-x-1"
                  >
                    {serverSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : 'Save'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setPresetUrl('/api')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                  >
                    Web Proxy (/api)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUrl('http://10.0.2.2:8000/api')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                  >
                    Android Emulator (10.0.2.2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUrl('http://localhost:8000/api')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                  >
                    Localhost (8000)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
