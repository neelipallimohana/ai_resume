import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Database, 
  HardDriveDownload, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Building,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Common/Modal';
import { useToast } from '../context/ToastContext';

export const Settings = () => {
  const toast = useToast();

  const [settings, setSettings] = useState(null);
  const [aiInfo, setAiInfo] = useState(null);
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAI, setTestingAI] = useState(false);

  // Backups
  const [backups, setBackups] = useState([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  // API Key visibility toggle
  const [showKey, setShowKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Dropdown list new item inputs
  const [newDept, setNewDept] = useState('');
  const [newInd, setNewInd] = useState('');
  const [newFunc, setNewFunc] = useState('');
  const [newDosage, setNewDosage] = useState('');

  const fetchSettingsAndBackups = async () => {
    try {
      setLoading(true);
      const [sRes, bRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/settings/backups'),
      ]);
      setSettings(sRes.data.settings);
      setApiKeyInput(sRes.data.settings.openrouter_api_key || '');
      setAiInfo(sRes.data.ai);
      setDbInfo(sRes.data.database);
      setBackups(bRes.data.backups || []);
    } catch (err) {
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndBackups();
  }, []);

  const handleTestAI = async () => {
    try {
      setTestingAI(true);
      const res = await api.get('/api/settings/ai-status');
      setAiInfo(res.data);
      if (res.data.is_online) {
        toast.success(res.data.message);
      } else {
        toast.warning(res.data.message);
      }
    } catch (err) {
      toast.error('Failed to query OpenRouter AI API.');
    } finally {
      setTestingAI(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...settings,
        openrouter_api_key: apiKeyInput,
      };
      await api.put('/api/settings', payload);
      toast.success('System settings & OpenRouter configuration saved!');
      fetchSettingsAndBackups();
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      toast.info('Creating atomic backup of MongoDB collections and candidate files...');
      const res = await api.post('/api/settings/backups');
      toast.success(`Backup created: ${res.data.backup.filename}`);
      fetchSettingsAndBackups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Backup creation failed.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreFile) return;
    try {
      setRestoring(true);
      await api.post(`/api/settings/backups/${restoreFile}/restore`);
      toast.success('Backup successfully restored into MongoDB!');
      setRestoreFile(null);
      fetchSettingsAndBackups();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  const addItemToList = (field, value, clearFn) => {
    if (!value.trim()) return;
    setSettings((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()],
    }));
    clearFn('');
  };

  const removeItemFromList = (field, index) => {
    setSettings((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">System Administration & Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure MongoDB database, OpenRouter AI credentials, candidate category lists, and backup archives
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* OpenRouter AI Configuration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              OpenRouter AI Integration
            </h3>
            <button
              type="button"
              onClick={handleTestAI}
              disabled={testingAI}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingAI ? 'animate-spin' : ''}`} />
              Test OpenRouter API
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                OpenRouter API Key (Bearer Token)
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  placeholder="sk-or-v1-..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Obtain your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-purple-600 underline">openrouter.ai/keys</a>. Supports free & pay-as-you-go models.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Configured AI Model</label>
                <input
                  type="text"
                  value={settings.openrouter_model || ''}
                  onChange={(e) => setSettings({ ...settings, openrouter_model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  placeholder="meta-llama/llama-3.3-70b-instruct:free"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Examples: <code className="bg-slate-100 px-1 py-0.5 rounded">meta-llama/llama-3.3-70b-instruct:free</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">google/gemini-2.0-flash-exp:free</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">deepseek/deepseek-chat</code>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max Upload File Size (MB)</label>
                <input
                  type="number"
                  value={settings.max_file_size_mb || 16}
                  onChange={(e) => setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  min={1}
                  max={50}
                />
              </div>
            </div>

            {/* AI Status Banner */}
            <div className={`p-3.5 rounded-lg border text-xs ${
              aiInfo?.is_online 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {aiInfo?.is_online ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                <span>AI Service Status: {aiInfo?.is_online ? 'Active & Ready' : 'Heuristic Mode (API Key Required)'}</span>
              </div>
              <p className="mt-1 text-[11px]">{aiInfo?.message}</p>
            </div>
          </div>
        </div>

        {/* Database & MongoDB Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            MongoDB Database Engine
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Engine</span>
              <span className="font-semibold text-slate-800">MongoDB</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Database Name</span>
              <span className="font-mono font-semibold text-slate-800">{dbInfo?.database_name || 'resume_management'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-0.5">Connection Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Organization Profile */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            Organization Profile & Localization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={settings.organization_name || ''}
                onChange={(e) => setSettings({ ...settings, organization_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Application Title</label>
              <input
                type="text"
                value={settings.app_title || ''}
                onChange={(e) => setSettings({ ...settings, app_title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
              <input
                type="text"
                value={settings.timezone || ''}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date Format (Fixed for Excel)</label>
              <input
                type="text"
                disabled
                value="DD-MM-YYYY"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Lists */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Candidate Category Dropdowns
          </h3>

          {/* Departments */}
          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-slate-700">Departments</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {settings.departments?.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700">
                  {d}
                  <button type="button" onClick={() => removeItemFromList('departments', i)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="Add department name..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => addItemToList('departments', newDept, setNewDept)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Industries */}
          <div className="space-y-2 text-xs pt-2">
            <label className="block font-semibold text-slate-700">Industries</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
              {settings.industries?.map((ind, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded-md text-slate-700">
                  {ind}
                  <button type="button" onClick={() => removeItemFromList('industries', i)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInd}
                onChange={(e) => setNewInd(e.target.value)}
                placeholder="Add industry name..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => addItemToList('industries', newInd, setNewInd)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration Changes'}
          </button>
        </div>
      </form>

      {/* MongoDB Backups Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              MongoDB Database & File Storage Backups
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export all MongoDB collections and candidate files to an atomic ZIP archive
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <HardDriveDownload className="w-4 h-4" />
            {creatingBackup ? 'Creating...' : 'Create New Backup'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Backup Archive</th>
                <th className="px-4 py-2.5">Created Timestamp</th>
                <th className="px-4 py-2.5">Archive Size</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.length > 0 ? (
                backups.map((b) => (
                  <tr key={b.filename} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2.5 font-mono text-slate-800">{b.filename}</td>
                    <td className="px-4 py-2.5 text-slate-600">{b.created_at}</td>
                    <td className="px-4 py-2.5 text-slate-600">{(b.size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/api/settings/backups/${b.filename}/download`}
                          download
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                          title="Download Backup"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setRestoreFile(b.filename)}
                          className="p-1 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                          title="Restore into MongoDB"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No backups created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={Boolean(restoreFile)}
        onClose={() => setRestoreFile(null)}
        title="Confirm MongoDB Restore"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <p className="font-semibold text-amber-900">Are you sure you want to restore this backup?</p>
              <p className="mt-1">
                Restoring <strong className="font-mono">{restoreFile}</strong> will overwrite current MongoDB collections with the state preserved in this backup.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRestoreFile(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={restoring}
              className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {restoring ? 'Restoring...' : 'Confirm Restore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
