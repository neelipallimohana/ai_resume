import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  FileArchive, 
  Trash2, 
  Edit, 
  Eye, 
  CalendarPlus, 
  FileDown, 
  RefreshCw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  LayoutList, 
  Table, 
  Calendar, 
  ChevronDown, 
  CalendarDays, 
  FolderArchive,
  Check
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CandidateList = () => {
  const { user, hasPermission } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Period / Date filters
  const [period, setPeriod] = useState('all'); // 'all' | 'today' | 'this_week' | 'this_month' | 'custom'
  const [selectedDate, setSelectedDate] = useState('');
  const [periodSummary, setPeriodSummary] = useState(null);

  // Dropdown menus
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [zipMenuOpen, setZipMenuOpen] = useState(false);
  const exportRef = useRef(null);
  const zipRef = useRef(null);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [qualification, setQualification] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown options
  const [settings, setSettings] = useState(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState('standard'); // 'standard' | 'excel24'

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Follow-up modal state
  const [followupCandidate, setFollowupCandidate] = useState(null);
  const [followupForm, setFollowupForm] = useState({
    follow_up_date: new Date().toISOString().split('T')[0],
    follow_up_time: '11:00',
    follow_up_type: 'Call',
    notes: '',
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
      if (zipRef.current && !zipRef.current.contains(e.target)) {
        setZipMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data.settings);
    } catch (err) {
      console.error('Failed to load settings dropdowns:', err);
    }
  };

  const fetchPeriodSummary = async () => {
    try {
      const res = await api.get('/api/candidates/period-summary');
      setPeriodSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch period summary:', err);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: perPage,
        search,
        department,
        qualification,
        location,
        status,
        period: period !== 'all' ? period : undefined,
        date: selectedDate || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const res = await api.get('/api/candidates', { params });
      setCandidates(res.data.candidates);
      setTotal(res.data.total);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch candidates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchPeriodSummary();
  }, [page, perPage, department, status, period, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCandidates();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('');
    setQualification('');
    setLocation('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPeriod('all');
    setSelectedDate('');
    setPage(1);
    setTimeout(fetchCandidates, 50);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportExcel = async (targetPeriod = null) => {
    try {
      setExportMenuOpen(false);
      toast.info('Generating exact 24-column candidate workbook...');
      let res;
      let filename = 'candidates_export.xlsx';

      if (targetPeriod === 'selected' || (!targetPeriod && selectedIds.length > 0)) {
        res = await api.post(
          '/api/candidates/export-excel',
          { candidate_ids: selectedIds },
          { responseType: 'blob' }
        );
        filename = `candidates_selected_${selectedIds.length}_records.xlsx`;
      } else {
        const effectivePeriod = targetPeriod || period;
        const params = {
          period: effectivePeriod !== 'all' ? effectivePeriod : undefined,
          date: selectedDate || undefined,
          search: search || undefined,
          department: department || undefined,
          qualification: qualification || undefined,
          status: status || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        };
        res = await api.get('/api/candidates/export-excel', { params, responseType: 'blob' });
        const periodName = effectivePeriod === 'today' ? 'today' : effectivePeriod === 'this_week' ? 'this_week' : effectivePeriod === 'this_month' ? 'this_month' : 'all';
        filename = `candidates_${periodName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Candidate Excel workbook exported successfully!');
    } catch (err) {
      toast.error('Failed to export candidate workbook.');
    }
  };

  const handleBulkDownloadZip = async (targetPeriod = null) => {
    try {
      setZipMenuOpen(false);
      toast.info('Packaging candidate resumes into ZIP archive (folders by candidate name)...');
      let res;
      let filename = 'resumes_archive.zip';

      if (targetPeriod === 'selected' || (!targetPeriod && selectedIds.length > 0)) {
        res = await api.post(
          '/api/candidates/bulk-download-zip',
          { candidate_ids: selectedIds },
          { responseType: 'blob' }
        );
        filename = `resumes_selected_${selectedIds.length}_candidates.zip`;
      } else {
        const effectivePeriod = targetPeriod || period;
        const params = {
          period: effectivePeriod !== 'all' ? effectivePeriod : undefined,
          date: selectedDate || undefined,
          search: search || undefined,
          department: department || undefined,
          qualification: qualification || undefined,
          status: status || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        };
        res = await api.get('/api/candidates/bulk-download-zip', { params, responseType: 'blob' });
        const periodName = effectivePeriod === 'today' ? 'today' : effectivePeriod === 'this_week' ? 'this_week' : effectivePeriod === 'this_month' ? 'this_month' : 'all';
        filename = `resumes_${periodName}_${new Date().toISOString().slice(0, 10)}.zip`;
      }

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ZIP package downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download ZIP archive.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      setDeleting(true);
      await api.delete(`/api/candidates/${deleteCandidate.id}`);
      toast.success(`Candidate ${deleteCandidate.candidate_uid} deleted.`);
      setDeleteCandidate(null);
      fetchCandidates();
      fetchPeriodSummary();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete candidate.');
    } finally {
      setDeleting(false);
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    if (!followupCandidate) return;
    try {
      await api.post('/api/followups', {
        candidate_id: followupCandidate.id,
        follow_up_date: followupForm.follow_up_date,
        follow_up_time: followupForm.follow_up_time,
        follow_up_type: followupForm.follow_up_type,
        notes: followupForm.notes,
      });
      toast.success(`Follow-up scheduled for ${followupCandidate.name || followupCandidate.candidate_uid}!`);
      setFollowupCandidate(null);
      setFollowupForm({
        follow_up_date: new Date().toISOString().split('T')[0],
        follow_up_time: '11:00',
        follow_up_type: 'Call',
        notes: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule follow-up.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidate Records</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict 24-Column recruitment registry with full-text search, date-wise filters & bulk downloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel Dropdown / Button */}
          {hasPermission('can_export') && (
            <div className="relative" ref={exportRef}>
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleExportExcel(selectedIds.length > 0 ? 'selected' : null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  title="Export formatted 24-column Excel workbook"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {selectedIds.length > 0
                    ? `Export Selected (${selectedIds.length})`
                    : period === 'today'
                    ? 'Export Today to Excel'
                    : period === 'this_week'
                    ? 'Export This Week to Excel'
                    : period === 'this_month'
                    ? 'Export This Month to Excel'
                    : 'Export All to Excel'}
                </button>
                <button
                  type="button"
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs border-l border-emerald-500 transition"
                  title="Choose export period"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    Excel Export Options (24 Columns)
                  </div>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleExportExcel('selected')}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-800 font-semibold flex items-center justify-between"
                    >
                      <span>Selected Candidates</span>
                      <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{selectedIds.length}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleExportExcel('today')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>📅 Today's Uploads</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.today_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportExcel('this_week')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>🗓️ This Week's Uploads</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.week_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportExcel('this_month')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>📆 This Month's Uploads</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.month_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportExcel('all')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between border-t border-slate-100 font-semibold"
                  >
                    <span>🌐 All Candidates (Total)</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.total_count ?? '-'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Download ZIP Dropdown / Button */}
          {hasPermission('can_download') && (
            <div className="relative" ref={zipRef}>
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleBulkDownloadZip(selectedIds.length > 0 ? 'selected' : null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
                  title="Download candidate resumes organized in folders by candidate name"
                >
                  <FileArchive className="w-4 h-4" />
                  {selectedIds.length > 0
                    ? `Download ZIP (${selectedIds.length})`
                    : period === 'today'
                    ? 'Download Today (ZIP)'
                    : period === 'this_week'
                    ? 'Download Week (ZIP)'
                    : period === 'this_month'
                    ? 'Download Month (ZIP)'
                    : 'Download All (ZIP)'}
                </button>
                <button
                  type="button"
                  onClick={() => setZipMenuOpen((prev) => !prev)}
                  className="px-2 py-2 bg-slate-900 hover:bg-black text-white text-xs border-l border-slate-700 transition"
                  title="Choose ZIP download period"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {zipMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <div className="px-3 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    ZIP Download (Folders by Candidate Name)
                  </div>
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleBulkDownloadZip('selected')}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-blue-700 font-semibold flex items-center justify-between"
                    >
                      <span>Selected Resumes</span>
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">{selectedIds.length}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleBulkDownloadZip('today')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>📦 Today's Resumes</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.today_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkDownloadZip('this_week')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>📦 This Week's Resumes</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.week_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkDownloadZip('this_month')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                  >
                    <span>📦 This Month's Resumes</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.month_count ?? '-'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkDownloadZip('all')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center justify-between border-t border-slate-100 font-semibold"
                  >
                    <span>📦 All Resumes (Complete Archive)</span>
                    <span className="text-slate-400 text-[11px] font-mono">{periodSummary?.total_count ?? '-'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {hasPermission('can_upload') && (
            <Link
              to="/upload"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Upload Resumes
            </Link>
          )}

          {hasPermission('can_edit') && (
            <Link
              to="/candidates/new"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Add Manually
            </Link>
          )}
        </div>
      </div>

      {/* Date-Wise Management & Period Tabs Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            Upload Date:
          </span>

          <button
            type="button"
            onClick={() => {
              setPeriod('all');
              setSelectedDate('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              period === 'all' && !selectedDate
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Candidates
            {periodSummary && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'all' && !selectedDate ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {periodSummary.total_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPeriod('today');
              setSelectedDate('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              period === 'today'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📅 Today
            {periodSummary && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'today' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {periodSummary.today_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPeriod('this_week');
              setSelectedDate('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              period === 'this_week'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🗓️ This Week
            {periodSummary && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'this_week' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {periodSummary.week_count}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setPeriod('this_month');
              setSelectedDate('');
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              period === 'this_month'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📆 This Month
            {periodSummary && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${period === 'this_month' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {periodSummary.month_count}
              </span>
            )}
          </button>
        </div>

        {/* Specific Date Lookup */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Pick Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPeriod('daily');
              setPage(1);
            }}
            className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white text-slate-700 focus:outline-hidden"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setPeriod('all');
                setPage(1);
              }}
              className="text-slate-400 hover:text-slate-600"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, email, company, designation, qualification..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Departments</option>
              {settings?.departments?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Manual">Manual</option>
              <option value="Failed">Failed</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Apply Filter
            </button>

            {(search || department || status || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table Header Bar with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <span className="text-xs text-slate-500 font-medium">
          Showing {candidates.length} of {total} candidates
        </span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('standard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              viewMode === 'standard'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Standard View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('excel24')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
              viewMode === 'excel24'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Full 24 Excel Columns (A - X)
          </button>
        </div>
      </div>

      {/* Candidates Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'standard' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={candidates.length > 0 && selectedIds.length === candidates.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3">S.No</th>
                  <th className="px-4 py-3">UID & Date</th>
                  <th className="px-4 py-3">Candidate Name</th>
                  <th className="px-4 py-3">Mobile & Email</th>
                  <th className="px-4 py-3">Qualification</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Present Company</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidates.length > 0 ? (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">{c.s_no}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono font-medium text-slate-800">{c.candidate_uid}</p>
                        <p className="text-[10px] text-slate-400">{c.date}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.name || 'Unnamed'}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-mono text-[11px]">{c.mobile_no || '-'}</p>
                        <p className="text-slate-400 text-[11px] truncate max-w-[140px]">{c.email_id || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.qualification || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.experience || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.present_company || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.designation || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{c.current_location || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.extraction_status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/candidates/${c.id}`}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {hasPermission('can_edit') && (
                            <Link
                              to={`/candidates/${c.id}/edit`}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                              title="Edit Candidate"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}

                          {hasPermission('can_followup') && (
                            <button
                              onClick={() => setFollowupCandidate(c)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                              title="Schedule Follow-up"
                            >
                              <CalendarPlus className="w-4 h-4" />
                            </button>
                          )}

                          {hasPermission('can_download') && c.stored_filename && (
                            <a
                              href={`/api/candidates/${c.id}/download-resume`}
                              download
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                              title="Download Original Resume"
                            >
                              <FileDown className="w-4 h-4" />
                            </a>
                          )}

                          {(user?.role === 'admin' || hasPermission('can_delete')) && (
                            <button
                              onClick={() => setDeleteCandidate(c)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                              title="Delete Candidate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                      No candidates matched your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* Full 24-Column Excel Sheet View */
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="px-3 py-2 w-8 sticky left-0 bg-slate-100 z-10">
                    <input
                      type="checkbox"
                      checked={candidates.length > 0 && selectedIds.length === candidates.length}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 py-2 text-center font-mono text-blue-700 bg-blue-50/50">A. S.No</th>
                  <th className="px-3 py-2">B. Date</th>
                  <th className="px-3 py-2 sticky left-8 bg-slate-100 z-10 font-bold text-slate-900 border-r border-slate-200">
                    C. Name
                  </th>
                  <th className="px-3 py-2">D. Mobile.no</th>
                  <th className="px-3 py-2">E. Email ID</th>
                  <th className="px-3 py-2">F. Gender</th>
                  <th className="px-3 py-2">G. Qualification</th>
                  <th className="px-3 py-2">H. Year of passout</th>
                  <th className="px-3 py-2">I. Department</th>
                  <th className="px-3 py-2">J. Industry</th>
                  <th className="px-3 py-2">K. Function/Unit</th>
                  <th className="px-3 py-2">L. Dosage form / area</th>
                  <th className="px-3 py-2">M. Experience</th>
                  <th className="px-3 py-2">N. Present company</th>
                  <th className="px-3 py-2">O. Designation</th>
                  <th className="px-3 py-2">P. Regulatory exposure</th>
                  <th className="px-3 py-2">Q. Audit experience</th>
                  <th className="px-3 py-2">R. Current CTC</th>
                  <th className="px-3 py-2">S. Expected CTC</th>
                  <th className="px-3 py-2">T. Notice Period</th>
                  <th className="px-3 py-2">U. Current location</th>
                  <th className="px-3 py-2">V. Preferred location</th>
                  <th className="px-3 py-2">W. Shared By</th>
                  <th className="px-3 py-2">X. Call remarks</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right sticky right-0 bg-slate-100 z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={27} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading candidates...
                    </td>
                  </tr>
                ) : candidates.length > 0 ? (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition">
                      <td className="px-3 py-2 sticky left-0 bg-white hover:bg-blue-50/40 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelectOne(c.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400">{c.s_no}</td>
                      <td className="px-3 py-2 text-slate-600">{c.date || '-'}</td>
                      <td className="px-3 py-2 sticky left-8 bg-white hover:bg-blue-50/40 z-10 font-bold text-slate-900 border-r border-slate-200">
                        <Link to={`/candidates/${c.id}`} className="hover:text-blue-600">
                          {c.name || 'Unnamed'}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-800">{c.mobile_no || '-'}</td>
                      <td className="px-3 py-2 text-blue-600">{c.email_id || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.gender || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.qualification || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.year_of_passout || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.department || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.industry || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.function_unit || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.dosage_form_area || '-'}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{c.experience || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.present_company || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.designation || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.regulatory_exposure || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.audit_experience || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.current_ctc || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.expected_ctc || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.notice_period || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.current_location || '-'}</td>
                      <td className="px-3 py-2 text-slate-700">{c.preferred_location || '-'}</td>
                      <td className="px-3 py-2 text-slate-600">{c.shared_by || '-'}</td>
                      <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate" title={c.call_remarks}>
                        {c.call_remarks || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={c.extraction_status} />
                      </td>
                      <td className="px-3 py-2 text-right sticky right-0 bg-white hover:bg-blue-50/40 z-10 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/candidates/${c.id}`}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          {hasPermission('can_edit') && (
                            <Link
                              to={`/candidates/${c.id}/edit`}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={27} className="px-6 py-12 text-center text-slate-400">
                      No candidates matched your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold">{candidates.length}</span> of{' '}
            <span className="font-semibold">{total}</span> candidate records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Record Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-rose-600">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700">
              <p className="font-semibold text-rose-900">Are you sure you want to delete this candidate?</p>
              <p className="mt-1">
                Candidate <span className="font-mono font-bold">{deleteCandidate?.candidate_uid}</span> (
                {deleteCandidate?.name || 'Unnamed'}) and all attached resume files will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setDeleteCandidate(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="px-3.5 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Follow-up Quick Scheduling Modal */}
      <Modal
        isOpen={Boolean(followupCandidate)}
        onClose={() => setFollowupCandidate(null)}
        title={`Schedule Follow-up: ${followupCandidate?.name || followupCandidate?.candidate_uid}`}
      >
        <form onSubmit={handleScheduleFollowup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                required
                value={followupForm.follow_up_date}
                onChange={(e) => setFollowupForm({ ...followupForm, follow_up_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Time</label>
              <input
                type="time"
                value={followupForm.follow_up_time}
                onChange={(e) => setFollowupForm({ ...followupForm, follow_up_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Type</label>
            <select
              value={followupForm.follow_up_type}
              onChange={(e) => setFollowupForm({ ...followupForm, follow_up_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              <option value="Call">Phone Call</option>
              <option value="Interview">Interview Scheduling</option>
              <option value="Screening">Technical Screening</option>
              <option value="Offer Discussion">Offer Discussion</option>
              <option value="Email">Email Follow-up</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Remarks</label>
            <textarea
              rows={3}
              value={followupForm.notes}
              onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
              placeholder="e.g. Candidate requested discussion regarding notice period and CTC..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setFollowupCandidate(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Schedule Follow-up
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
