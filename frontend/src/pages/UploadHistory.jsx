import React, { useEffect, useState } from 'react';
import { History, Download, CheckCircle, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const UploadHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/upload-history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (date) => {
    if (!window.confirm(`Delete all data for ${date}? This is irreversible.`)) return;
    try {
      await api.delete(`/upload/${date}`);
      fetchHistory();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Upload Audit History</h2>
        <p className="text-xs text-slate-500 mt-1">Track every daily processing run with reconciliation status and download links.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Attendance File</th>
                <th className="px-5 py-3">Report File</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Present</th>
                <th className="px-5 py-3 text-right">Absent</th>
                <th className="px-5 py-3 text-right">Submitted</th>
                <th className="px-5 py-3 text-right">Not Sub.</th>
                <th className="px-5 py-3 text-right">Late</th>
                <th className="px-5 py-3">Processed At</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-12 text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No uploads processed yet.</p>
                    <p className="text-xs mt-1">Go to Daily Upload to process your first Excel files.</p>
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3 font-bold text-slate-800">{row.date}</td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[120px]">{row.attendance_filename}</td>
                    <td className="px-5 py-3 text-slate-600 truncate max-w-[120px]">{row.report_filename}</td>
                    <td className="px-5 py-3 text-center">
                      {row.reconciliation_valid ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span className="font-semibold">Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-semibold">Warning</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{row.total_employees}</td>
                    <td className="px-5 py-3 text-right text-emerald-600 font-medium">{row.present_count}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{row.absent_count}</td>
                    <td className="px-5 py-3 text-right text-emerald-600">{row.reports_submitted}</td>
                    <td className="px-5 py-3 text-right text-rose-600">{row.reports_not_submitted}</td>
                    <td className="px-5 py-3 text-right text-amber-600">{row.late_punch_ins}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(row.processed_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => window.open(`/api/export/${row.date}/excel`, '_blank')}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          title="Download 9-Sheet Excel"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(row.date)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete this date's data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UploadHistory;
