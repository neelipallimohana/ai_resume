import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  KeyRound,
  Shield,
  Edit2
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Employees = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'employee',
    permissions: {
      can_upload: true,
      can_view: true,
      can_edit: true,
      can_download: true,
      can_export: true,
      can_followup: true,
      can_visitors: true,
    },
  });

  // Reset Password Modal
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Permissions Edit Modal
  const [permUser, setPermUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/employees');
      setEmployees(res.data.employees || []);
    } catch (err) {
      toast.error('Failed to load employee accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/employees', createForm);
      toast.success(`Employee account '${createForm.username}' created!`);
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'employee',
        permissions: {
          can_upload: true,
          can_view: true,
          can_edit: true,
          can_download: true,
          can_export: true,
          can_followup: true,
          can_visitors: true,
        },
      });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee account.');
    }
  };

  const toggleUserActive = async (emp) => {
    try {
      await api.put(`/api/employees/${emp.id}`, { is_active: !emp.is_active });
      toast.success(`Account ${emp.username} ${!emp.is_active ? 'activated' : 'deactivated'}.`);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update account status.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    try {
      await api.post(`/api/employees/${resetUser.id}/reset-password`, { password: newPassword });
      toast.success(`Password for ${resetUser.username} has been reset.`);
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password.');
    }
  };

  const openPermModal = (emp) => {
    setPermUser(emp);
    setUserPermissions(emp.permissions || {});
  };

  const handleSavePermissions = async () => {
    if (!permUser) return;
    try {
      await api.put(`/api/employees/${permUser.id}`, { permissions: userPermissions });
      toast.success(`Permissions updated for ${permUser.username}!`);
      setPermUser(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update permissions.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee & Permission Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-controlled employee provisioning and granular access enforcement
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          Create Employee Account
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading accounts...
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900">{emp.full_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{emp.username}</td>
                    <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        emp.role === 'admin' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {emp.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.is_active ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {emp.created_at ? emp.created_at.slice(0, 10) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.role !== 'admin' && (
                          <button
                            onClick={() => openPermModal(emp)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                            title="Configure Permissions"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setResetUser(emp)}
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {emp.id !== user?.id && (
                          <button
                            onClick={() => toggleUserActive(emp)}
                            className={`p-1 rounded transition ${
                              emp.is_active
                                ? 'text-rose-500 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={emp.is_active ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {emp.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No employee accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Employee Account"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={createForm.full_name}
                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Employee full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. jsmith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="jsmith@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Granular Role & Permissions</label>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              {[
                { key: 'can_upload', label: 'Upload Resumes' },
                { key: 'can_view', label: 'View Candidates' },
                { key: 'can_edit', label: 'Create & Edit Candidates' },
                { key: 'can_download', label: 'Download Resumes & ZIPs' },
                { key: 'can_export', label: 'Export 24-Column Excel' },
                { key: 'can_followup', label: 'Manage Follow-ups' },
                { key: 'can_visitors', label: 'Access OFC Visitor Desk' },
              ].map((perm) => (
                <label key={perm.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(createForm.permissions[perm.key])}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        permissions: {
                          ...createForm.permissions,
                          [perm.key]: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Permissions Edit Modal */}
      <Modal
        isOpen={Boolean(permUser)}
        onClose={() => setPermUser(null)}
        title={`Edit Permissions: ${permUser?.username}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the specific modules and actions permitted for {permUser?.full_name}.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            {[
              { key: 'can_upload', label: 'Upload Resumes' },
              { key: 'can_view', label: 'View Candidates' },
              { key: 'can_edit', label: 'Create & Edit Candidates' },
              { key: 'can_download', label: 'Download Resumes & ZIPs' },
              { key: 'can_export', label: 'Export 24-Column Excel' },
              { key: 'can_followup', label: 'Manage Follow-ups' },
              { key: 'can_visitors', label: 'Access OFC Visitor Desk' },
            ].map((perm) => (
              <label key={perm.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(userPermissions[perm.key])}
                  onChange={(e) =>
                    setUserPermissions({
                      ...userPermissions,
                      [perm.key]: e.target.checked,
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-800 font-medium">{perm.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPermUser(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Save Permissions
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        title={`Reset Password for ${resetUser?.username}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (minimum 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setResetUser(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition"
            >
              Reset Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
