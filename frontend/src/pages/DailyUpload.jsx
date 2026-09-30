import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';

export const DailyUpload = ({ onUploadSuccess }) => {
  const [date, setDate] = useState('2026-09-15');
  const [attFile, setAttFile] = useState(null);
  const [repFile, setRepFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Daily Data Ingestion & Processing</h2>
        <p className="text-xs text-slate-500 mt-1">
          Upload daily Attendance and Report Excel files. The platform cleans, reconciles, and generates a formatted 9-sheet analysis workbook.
        </p>
      </div>

      {/* Date & Settings Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Target Processing Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="replaceExisting"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="replaceExisting" className="text-xs font-medium text-slate-700 cursor-pointer">
            Replace existing records if already processed for this date
          </label>
        </div>
      </div>

      {/* Dual Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section A: Attendance Excel */}
        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Attendance Excel File</h3>
                <p className="text-xs text-slate-400">e.g. Attendance_YYYY-MM-DD.xlsx</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Contains punch-in, punch-out times, and official employee attendance records.
            </p>

            <label className="block cursor-pointer">
              <div className="px-4 py-8 bg-slate-50 rounded-lg border border-slate-200 text-center hover:bg-blue-50/50 transition">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {attFile ? attFile.name : 'Click to select Attendance Excel (.xlsx)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {attFile ? `${(attFile.size / 1024).toFixed(1)} KB selected` : 'Drag & drop or browse files'}
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
            <div className="mt-4 flex items-center justify-between text-xs text-emerald-600 font-medium">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                B
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Report Excel File</h3>
                <p className="text-xs text-slate-400">e.g. Daily_Report_YYYY-MM-DD.xlsx</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Contains employee daily work reports, submission status, and quality ratings.
            </p>

            <label className="block cursor-pointer">
              <div className="px-4 py-8 bg-slate-50 rounded-lg border border-slate-200 text-center hover:bg-emerald-50/50 transition">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 block">
                  {repFile ? repFile.name : 'Click to select Daily Report Excel (.xlsx)'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {repFile ? `${(repFile.size / 1024).toFixed(1)} KB selected` : 'Drag & drop or browse files'}
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
            <div className="mt-4 flex items-center justify-between text-xs text-emerald-600 font-medium">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
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

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleProcess}
          disabled={uploading || !attFile || !repFile}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Validating & Reconciling Data...</span>
            </>
          ) : (
            <>
              <span>Process Daily Data</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Result & Reconciliation Card */}
      {result && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">{result.message}</h3>
                <p className="text-xs text-slate-500">Processed {result.total_employees} employees for {result.date}</p>
              </div>
            </div>
            <button
              onClick={() => window.open(result.download_url, '_blank')}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Generated 9-Sheet Excel</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Total Employees</span>
              <span className="text-lg font-bold text-slate-800">{result.total_employees}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <span className="text-[11px] text-emerald-600 block">Present</span>
              <span className="text-lg font-bold text-emerald-800">{result.present_count}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <span className="text-[11px] text-slate-500 block">Absent</span>
              <span className="text-lg font-bold text-slate-800">{result.absent_count}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <span className="text-[11px] text-emerald-600 block">Submitted</span>
              <span className="text-lg font-bold text-emerald-800">{result.reports_submitted}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg text-center">
              <span className="text-[11px] text-rose-600 block">Not Submitted</span>
              <span className="text-lg font-bold text-rose-800">{result.reports_not_submitted}</span>
            </div>
          </div>

          {/* Warnings list if any */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
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
