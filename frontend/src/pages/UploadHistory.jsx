import React, { useEffect, useState } from 'react';
import { History, CheckCircle, AlertTriangle, RefreshCw, Trash2, Calendar, FileSpreadsheet } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export const UploadHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingDate, setDownloadingDate] = useState(null);
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async (date) => {
    if (downloadingDate) return;
    setDownloadingDate(date);
    try {
      const res = await api.get(`/export/${date}/excel`, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Analysis_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download Excel file. Please make sure data exists for this date.');
    } finally {
      setDownloadingDate(null);
    }
  };

  const handleDelete = async (date) => {
    if (!window.confirm(`Delete all data for ${date}? This cannot be undone.`)) return;
    try {
      await api.delete(`/upload/${date}`);
      fetchHistory();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Upload Audit History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all processed daily datasets with mathematical reconciliation verification and direct Excel downloads.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Desktop Table View (md and up) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-white uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Attendance File</th>
                <th className="px-5 py-3.5">Report File</th>
                <th className="px-5 py-3.5 text-center">Reconciliation</th>
                <th className="px-5 py-3.5 text-right">Roster</th>
                <th className="px-5 py-3.5 text-right">Present</th>
                <th className="px-5 py-3.5 text-right">Absent</th>
                <th className="px-5 py-3.5 text-right">Submitted</th>
                <th className="px-5 py-3.5 text-right">Late</th>
                <th className="px-5 py-3.5">Processed Time</th>
                <th className="px-5 py-3.5 text-center">Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-16 text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">No uploads processed yet</p>
                    <p className="text-xs mt-1">Process daily Excel files to see audit history here.</p>
                  </td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{row.date}</td>
                    <td className="px-5 py-3.5 text-slate-600 truncate max-w-[130px] font-mono text-[11px]" title={row.attendance_filename}>
                      {row.attendance_filename}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 truncate max-w-[130px] font-mono text-[11px]" title={row.report_filename}>
                      {row.report_filename}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.reconciliation_valid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Warning</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-800">{row.total_employees}</td>
                    <td className="px-5 py-3.5 text-right text-emerald-600 font-bold">{row.present_count}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{row.absent_count}</td>
                    <td className="px-5 py-3.5 text-right text-blue-600 font-semibold">{row.reports_submitted}</td>
                    <td className="px-5 py-3.5 text-right text-amber-600 font-bold">{row.late_punch_ins}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                      {row.processed_at ? new Date(row.processed_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownload(row.date)}
                          disabled={downloadingDate === row.date}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition font-bold text-[11px] active:scale-95 disabled:opacity-50"
                          title="Download 9-Sheet Processed Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>{downloadingDate === row.date ? '...' : 'Excel'}</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(row.date)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete this date's records"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Mobile Card View (phones and small tablets) */}
      <div className="md:hidden space-y-3.5">
        {history.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <History className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No uploads processed yet</p>
          </div>
        ) : (
          history.map((row) => (
            <div key={row.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-black text-slate-900">{row.date}</span>
                </div>
                {row.reconciliation_valid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    Notice
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold block">Total</span>
                  <span className="text-xs font-bold text-slate-800">{row.total_employees}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-600 uppercase font-semibold block">Present</span>
                  <span className="text-xs font-bold text-emerald-700">{row.present_count}</span>
                </div>
                <div>
                  <span className="text-[9px] text-blue-600 uppercase font-semibold block">Reports</span>
                  <span className="text-xs font-bold text-blue-700">{row.reports_submitted}</span>
                </div>
                <div>
                  <span className="text-[9px] text-amber-600 uppercase font-semibold block">Late</span>
                  <span className="text-xs font-bold text-amber-700">{row.late_punch_ins}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleDownload(row.date)}
                  disabled={downloadingDate === row.date}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{downloadingDate === row.date ? 'Downloading...' : 'Download 9-Sheet Excel'}</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(row.date)}
                    className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition active:scale-90"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UploadHistory;
