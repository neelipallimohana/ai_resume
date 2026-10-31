import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Clock, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  Calendar,
  X,
  Phone,
  Building
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const VisitorDashboard = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [presentCount, setPresentCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Register Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    mobile_no: '',
    organization: '',
    purpose_of_visit: '',
    person_to_meet: '',
    visit_date: new Date().toISOString().split('T')[0],
    entry_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    notes: '',
  });
  const [registering, setRegistering] = useState(false);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = { search, status, date: dateFilter };
      const res = await api.get('/api/visitors', { params });
      setVisitors(res.data.visitors || []);
      setTotal(res.data.total || 0);
      setPresentCount(res.data.present_count || 0);
    } catch (err) {
      toast.error('Failed to load visitor records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [status, dateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVisitors();
  };

  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    try {
      setRegistering(true);
      const res = await api.post('/api/visitors', registerForm);
      toast.success(`Visitor ${res.data.visitor.visitor_uid} registered successfully!`);
      setShowRegisterModal(false);
      setRegisterForm({
        name: '',
        mobile_no: '',
        organization: '',
        purpose_of_visit: '',
        person_to_meet: '',
        visit_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        notes: '',
      });
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register visitor.');
    } finally {
      setRegistering(false);
    }
  };

  const handleMarkExit = async (visitor) => {
    try {
      const exitTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      await api.post(`/api/visitors/${visitor.id}/mark-exit`, { exit_time: exitTime });
      toast.success(`Exit recorded for ${visitor.name} at ${exitTime}.`);
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to record exit time.');
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info('Generating independent OFC Visitor workbook...');
      const params = { status, date: dateFilter };
      const res = await api.get('/api/visitors/export-excel', { params, responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ofc_visitors_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Visitor Excel workbook exported successfully!');
    } catch (err) {
      toast.error('Failed to export visitor workbook.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800">OFC Visitor Management</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
              Independent Module
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Office front desk reception, vendor sign-in, guest tracking, and dedicated visitor exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Visitor Excel
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            Register New Visitor
          </button>
        </div>
      </div>

      {/* Visitor Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Currently in Office</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Visitors Logged</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Exited Today</span>
            <p className="text-2xl font-bold text-slate-700 mt-1">
              {visitors.filter((v) => v.status === 'Exited').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by visitor name, mobile, organization, person to meet, purpose..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present (Active)</option>
              <option value="Exited">Exited</option>
              <option value="Expected">Expected</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="py-2 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-700"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Filter
            </button>

            {(search || status || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setDateFilter('');
                  setTimeout(fetchVisitors, 50);
                }}
                className="p-2 text-slate-400 hover:text-slate-600"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Visitor UID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Visitor Name</th>
                <th className="px-4 py-3">Mobile & Org</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Person to Meet</th>
                <th className="px-4 py-3">Entry Time</th>
                <th className="px-4 py-3">Exit Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading visitor records...
                  </td>
                </tr>
              ) : visitors.length > 0 ? (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{v.visitor_uid}</td>
                    <td className="px-4 py-3 text-slate-500">{v.visit_date}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{v.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{v.organization || 'Individual'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{v.mobile_no || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{v.purpose_of_visit}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{v.person_to_meet}</td>
                    <td className="px-4 py-3 text-slate-700">{v.entry_time}</td>
                    <td className="px-4 py-3 text-slate-700">{v.exit_time || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.status === 'Present' && (
                        <button
                          onClick={() => handleMarkExit(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-semibold transition"
                          title="Record Departure"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Mark Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    No visitor records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Registration Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Register Visitor Entry"
      >
        <form onSubmit={handleRegisterVisitor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Visitor Name *</label>
              <input
                type="text"
                required
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Guest full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={registerForm.mobile_no}
                onChange={(e) => setRegisterForm({ ...registerForm, mobile_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="+919876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Company</label>
              <input
                type="text"
                value={registerForm.organization}
                onChange={(e) => setRegisterForm({ ...registerForm, organization: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Acme Corp / Self"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose of Visit *</label>
              <input
                type="text"
                required
                value={registerForm.purpose_of_visit}
                onChange={(e) => setRegisterForm({ ...registerForm, purpose_of_visit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Vendor discussion, Interview, Client meeting"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Person to Meet *</label>
              <input
                type="text"
                required
                value={registerForm.person_to_meet}
                onChange={(e) => setRegisterForm({ ...registerForm, person_to_meet: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Host employee name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Time</label>
              <input
                type="time"
                required
                value={registerForm.entry_time}
                onChange={(e) => setRegisterForm({ ...registerForm, entry_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea
                rows={2}
                value={registerForm.notes}
                onChange={(e) => setRegisterForm({ ...registerForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Visitor badge #12 issued, carrying laptop"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowRegisterModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {registering ? 'Logging Entry...' : 'Register Visitor Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
