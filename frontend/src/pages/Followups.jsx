import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  User, 
  Edit3, 
  Trash2, 
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { useToast } from '../context/ToastContext';

export const Followups = () => {
  const toast = useToast();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('today'); // today, upcoming, overdue, completed, all

  // Edit / Reschedule Modal state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({
    follow_up_date: '',
    follow_up_time: '',
    follow_up_type: 'Call',
    status: 'Pending',
    notes: '',
  });

  const fetchFollowups = async (tab = filterTab) => {
    try {
      setLoading(true);
      const params = tab === 'all' ? {} : { filter: tab };
      const res = await api.get('/api/followups', { params });
      setFollowups(res.data.followups || []);
    } catch (err) {
      toast.error('Failed to load candidate follow-ups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups(filterTab);
  }, [filterTab]);

  const handleMarkComplete = async (f) => {
    try {
      await api.put(`/api/followups/${f.id}`, { status: 'Completed' });
      toast.success('Follow-up marked as Completed!');
      fetchFollowups();
    } catch (err) {
      toast.error('Failed to update follow-up status.');
    }
  };

  const openEditModal = (f) => {
    setEditItem(f);
    setEditForm({
      follow_up_date: f.follow_up_date || '',
      follow_up_time: f.follow_up_time || '',
      follow_up_type: f.follow_up_type || 'Call',
      status: f.status || 'Pending',
      notes: f.notes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      await api.put(`/api/followups/${editItem.id}`, editForm);
      toast.success('Follow-up updated successfully!');
      setEditItem(null);
      fetchFollowups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update follow-up.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this follow-up reminder?')) return;
    try {
      await api.delete(`/api/followups/${id}`);
      toast.success('Follow-up deleted.');
      fetchFollowups();
    } catch (err) {
      toast.error('Failed to delete follow-up.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidate Follow-up Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track scheduled calls, interview stages, and feedback reminders without external dependencies
          </p>
        </div>
        <Link
          to="/candidates"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          Schedule from Candidate
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { key: 'today', label: "Today's Follow-ups", icon: Clock },
          { key: 'upcoming', label: 'Upcoming', icon: Calendar },
          { key: 'overdue', label: 'Overdue', icon: AlertTriangle },
          { key: 'completed', label: 'Completed', icon: CheckCircle2 },
          { key: 'all', label: 'All Records', icon: CalendarClock },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = filterTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Follow-up Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading follow-ups...
          </div>
        ) : followups.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {followups.map((f) => (
              <div key={f.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {f.candidate_name || 'Unnamed Candidate'}
                    </span>
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {f.candidate_uid}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span>
                      📅 <strong className="text-slate-700">{f.follow_up_date}</strong> {f.follow_up_time && `at ${f.follow_up_time}`}
                    </span>
                    <span>&bull;</span>
                    <span>Type: <strong className="text-slate-700">{f.follow_up_type}</strong></span>
                    <span>&bull;</span>
                    <span>Assigned to: <strong className="text-slate-700">{f.assigned_to_name}</strong></span>
                  </p>

                  {f.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 inline-block max-w-xl">
                      "{f.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {f.status !== 'Completed' && (
                    <button
                      onClick={() => handleMarkComplete(f)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Complete
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(f)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    title="Edit / Reschedule"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/candidates/${f.candidate_id}`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="View Candidate"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No follow-ups found in this view.
          </div>
        )}
      </div>

      {/* Edit / Reschedule Modal */}
      <Modal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        title={`Update Follow-up: ${editItem?.candidate_name || editItem?.candidate_uid}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                required
                value={editForm.follow_up_date}
                onChange={(e) => setEditForm({ ...editForm, follow_up_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Time</label>
              <input
                type="time"
                value={editForm.follow_up_time}
                onChange={(e) => setEditForm({ ...editForm, follow_up_time: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={editForm.follow_up_type}
                onChange={(e) => setEditForm({ ...editForm, follow_up_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Call">Call</option>
                <option value="Interview">Interview</option>
                <option value="Screening">Screening</option>
                <option value="Offer Discussion">Offer Discussion</option>
                <option value="Email">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditItem(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Save Updates
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
