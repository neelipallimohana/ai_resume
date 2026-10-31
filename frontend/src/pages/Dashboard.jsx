import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CalendarClock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Building2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import { StatusBadge } from '../components/Common/Badge';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/dashboard/stats');
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard metrics. Please check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Aggregating live recruitment metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
        <p className="font-semibold">{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = data?.metrics || {};

  const statCards = [
    { title: 'Total Candidates', value: m.total_candidates, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Added Today', value: m.added_today, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Added This Month', value: m.added_this_month, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Resumes Uploaded', value: m.total_resumes_uploaded, icon: UploadCloud, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'AI Extraction Success', value: m.ai_success, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'AI Extraction Failed', value: m.ai_failed, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Pending Reviews', value: m.pending_reviews, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Follow-ups Due Today', value: m.followups_today, icon: CalendarClock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Overdue Follow-ups', value: m.followups_overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Visitors Present', value: m.visitors_present, icon: Building2, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Recruitment Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live database statistics and candidate distributions</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Resumes
          </Link>
          <Link
            to="/candidates/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Add Candidate Manually
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 leading-tight">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{card.value ?? 0}</p>
            </div>
          );
        })}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Candidates by Department</h3>
          {data?.charts?.department?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.department} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No department data available yet.
            </div>
          )}
        </div>

        {/* Qualification Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Candidates by Qualification</h3>
          {data?.charts?.qualification?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.qualification} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No qualification data available yet.
            </div>
          )}
        </div>

        {/* Experience Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Candidates by Experience Bracket</h3>
          {data?.charts?.experience?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.experience} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No experience data available yet.
            </div>
          )}
        </div>

        {/* Location Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Candidates by Location</h3>
          {data?.charts?.location?.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.charts.location} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              No location data available yet.
            </div>
          )}
        </div>
      </div>

      {/* Recently Added Candidates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recently Added Candidates</h3>
            <p className="text-xs text-slate-500">Latest candidate records created or uploaded</p>
          </div>
          <Link
            to="/candidates"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View All Candidates
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">UID</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Designation</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Experience</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recent_candidates?.length > 0 ? (
                data.recent_candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-3.5 font-mono font-medium text-slate-700">{c.candidate_uid}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">{c.name || 'Unnamed'}</td>
                    <td className="px-6 py-3.5 text-slate-600">{c.designation || '-'}</td>
                    <td className="px-6 py-3.5 text-slate-600">{c.present_company || '-'}</td>
                    <td className="px-6 py-3.5 text-slate-600">{c.experience || '-'}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={c.extraction_status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/candidates/${c.id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No candidates found. Start by uploading a resume or creating a manual record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
