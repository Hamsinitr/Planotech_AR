import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import api from '../api/client';

export const Settings = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/scoring-weights');
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const { id, ...payload } = config;
      await api.post('/settings/scoring-weights', payload);
      setMessage('Scoring weights saved successfully. Changes will apply to the next processing run.');
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  if (loading || !config) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  const totalWeight = (config.report_submission_weight + config.report_quality_weight + config.attendance_weight).toFixed(2);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Productivity Scoring Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure how employee productivity scores are calculated. Weights must sum to 1.00 (100%).
        </p>
      </div>

      {/* Weight Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <SettingsIcon className="w-4 h-4 text-blue-600" />
          <span>Productivity Weight Distribution</span>
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Report Submission Weight</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={config.report_submission_weight}
              onChange={(e) => updateField('report_submission_weight', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">{(config.report_submission_weight * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Report Quality Weight</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={config.report_quality_weight}
              onChange={(e) => updateField('report_quality_weight', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">{(config.report_quality_weight * 100).toFixed(0)}%</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Attendance Weight</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={config.attendance_weight}
              onChange={(e) => updateField('attendance_weight', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">{(config.attendance_weight * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className={`p-3 rounded-lg text-xs font-semibold ${totalWeight === '1.00' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          Total Weight: {totalWeight} {totalWeight === '1.00' ? '✓ Valid' : '✗ Must equal 1.00'}
        </div>
      </div>

      {/* Quality Scores */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Report Quality Sub-Scores (0 – 100)</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'excellent_score', label: 'Excellent', color: 'emerald' },
            { key: 'good_score', label: 'Good', color: 'sky' },
            { key: 'average_score', label: 'Average', color: 'amber' },
            { key: 'poor_score', label: 'Poor', color: 'rose' }
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-600 block mb-1">{label}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Scores */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Attendance Punctuality Sub-Scores (0 – 100)</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'before_930_score', label: 'Before 9:30 AM' },
            { key: 'grace_score', label: '9:30 – 9:45 AM (Grace)' },
            { key: 'after_945_score', label: 'After 9:45 AM (Late)' }
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-600 block mb-1">{label}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        {message && (
          <p className={`text-xs font-medium ${message.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
            {message}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || totalWeight !== '1.00'}
          className="ml-auto flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
