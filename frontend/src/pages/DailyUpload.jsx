import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export const DailyUpload = ({ onUploadSuccess }) => {
  const { showToast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attFile, setAttFile] = useState(null);
  const [repFile, setRepFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [attDrag, setAttDrag] = useState(false);
  const [repDrag, setRepDrag] = useState(false);

  useEffect(() => {
    // Optionally fetch latest uploaded date to suggest next or current date
    api.get('/upload-history')
      .then((res) => {
        if (res.data?.length > 0) {
          // If no date was picked yet, default to today or latest
          const latest = res.data[0].date;
          if (latest) setDate(latest);
        }
      })
      .catch(() => {});
  }, []);

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!attFile || !repFile) {
      setError('Please select both the Attendance and Daily Report Excel files.');
      return;
    }
    if (!date) {
      setError('Please specify the date for this dataset.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('date', date);
    formData.append('attendance_file', attFile);
    formData.append('report_file', repFile);
    formData.append('replace_existing', replaceExisting);

    try {
      const res = await api.post('/upload/daily-files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (onUploadSuccess) {
        onUploadSuccess(date);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process daily Excel files. Please check file formats.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadExcel = async (targetDate) => {
    const d = targetDate || date;
    if (!d || downloading) return;
    setDownloading(true);
    try {
      const response = await api.get(`/export/${d}/excel`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Analysis_${d}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Master Excel for ${d} downloaded successfully!`, 'success');
    } catch (err) {
      showToast('Failed to download Excel file. Please ensure data exists for this date.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Daily Data Ingestion & Reconciliation</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Upload daily Attendance and Daily Work Report Excel workbooks. The platform automatically reconciles roster records, evaluates reporting compliance, and generates a formatted 9-sheet master analysis workbook.
        </p>
      </div>

      {/* Date & Settings Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Processing Target Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60">
          <input
            type="checkbox"
            id="replaceExisting"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="replaceExisting" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            Overwrite existing records if already processed for this date
          </label>
        </div>
      </div>

      {/* Dual Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section A: Attendance Excel */}
        <div
          onDragOver={(e) => { e.preventDefault(); setAttDrag(true); }}
          onDragLeave={() => setAttDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setAttDrag(false);
            if (e.dataTransfer.files?.[0]) setAttFile(e.dataTransfer.files[0]);
          }}
          className={`bg-white p-6 rounded-3xl border-2 border-dashed transition-all shadow-sm flex flex-col justify-between ${
            attDrag ? 'border-blue-500 bg-blue-50/30 scale-[1.01]' : 'border-slate-200 hover:border-blue-400'
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Attendance Excel File</h3>
                <p className="text-[11px] text-slate-400">Attendance_YYYY-MM-DD.xlsx</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Contains employee biometric punch-in, punch-out timestamps, shift logs, and location flags.
            </p>

            <label className="block cursor-pointer">
              <div className={`px-4 py-8 rounded-2xl border text-center transition ${
                attFile ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}>
                <FileSpreadsheet className={`w-9 h-9 mx-auto mb-2 ${attFile ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {attFile ? attFile.name : 'Choose Attendance Excel (.xlsx)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {attFile ? `${(attFile.size / 1024).toFixed(1)} KB selected` : 'Drag & drop or click to browse'}
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => setAttFile(e.target.files[0])}
              />
            </label>
          </div>

          {attFile && (
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for parsing</span>
              </span>
              <button
                onClick={() => setAttFile(null)}
                className="text-slate-400 hover:text-rose-500 transition"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Section B: Daily Report Excel */}
        <div
          onDragOver={(e) => { e.preventDefault(); setRepDrag(true); }}
          onDragLeave={() => setRepDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setRepDrag(false);
            if (e.dataTransfer.files?.[0]) setRepFile(e.dataTransfer.files[0]);
          }}
          className={`bg-white p-6 rounded-3xl border-2 border-dashed transition-all shadow-sm flex flex-col justify-between ${
            repDrag ? 'border-emerald-500 bg-emerald-50/30 scale-[1.01]' : 'border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                B
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daily Work Report Excel</h3>
                <p className="text-[11px] text-slate-400">Daily_Report_YYYY-MM-DD.xlsx</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Contains employee daily task logs, quality evaluations (Excellent, Good, Average, Poor), and submission status.
            </p>

            <label className="block cursor-pointer">
              <div className={`px-4 py-8 rounded-2xl border text-center transition ${
                repFile ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
              }`}>
                <FileSpreadsheet className={`w-9 h-9 mx-auto mb-2 ${repFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {repFile ? repFile.name : 'Choose Daily Report Excel (.xlsx)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {repFile ? `${(repFile.size / 1024).toFixed(1)} KB selected` : 'Drag & drop or click to browse'}
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => setRepFile(e.target.files[0])}
              />
            </label>
          </div>

          {repFile && (
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ready for parsing</span>
              </span>
              <button
                onClick={() => setRepFile(null)}
                className="text-slate-400 hover:text-rose-500 transition"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Trigger Button */}
      <div className="flex justify-end">
        <button
          onClick={handleProcess}
          disabled={uploading || !attFile || !repFile}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl insta-gradient-btn text-white text-xs font-bold shadow-lg transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validating & Reconciling Datasets...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Process & Generate 9-Sheet Master Excel</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Success Result & Master Download Card */}
      {result && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">{result.message}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Processed {result.total_employees} employees for {result.date}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownloadExcel(result.date)}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download Generated 9-Sheet Excel'}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Roster</span>
              <span className="text-lg font-black text-slate-800">{result.total_employees}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-center">
              <span className="text-[10px] text-emerald-600 font-semibold block uppercase">Present</span>
              <span className="text-lg font-black text-emerald-700">{result.present_count}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Absent</span>
              <span className="text-lg font-black text-slate-700">{result.absent_count}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-center">
              <span className="text-[10px] text-blue-600 font-semibold block uppercase">Reports Filed</span>
              <span className="text-lg font-black text-blue-700">{result.reports_submitted}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-center">
              <span className="text-[10px] text-rose-600 font-semibold block uppercase">Not Submitted</span>
              <span className="text-lg font-black text-rose-700">{result.reports_not_submitted}</span>
            </div>
          </div>

          {/* Warnings list if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Processing Notes:</span>
              {result.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyUpload;
