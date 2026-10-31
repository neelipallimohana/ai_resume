import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Common/Modal';
import { useToast } from '../context/ToastContext';

export const CandidateForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    mobile_no: '',
    email_id: '',
    gender: '',
    qualification: '',
    year_of_passout: '',
    department: '',
    industry: '',
    function_unit: '',
    dosage_form_area: '',
    experience: '',
    present_company: '',
    designation: '',
    regulatory_exposure: '',
    audit_experience: '',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '',
    current_location: '',
    preferred_location: '',
    call_remarks: '',
    shared_by: '',
    extraction_status: 'Completed',
  });

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Duplicate warning modal state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const sRes = await api.get('/api/settings');
        setSettings(sRes.data.settings);

        if (isEdit) {
          const cRes = await api.get(`/api/candidates/${id}`);
          const c = cRes.data.candidate;
          setForm({
            name: c.name || '',
            mobile_no: c.mobile_no || '',
            email_id: c.email_id || '',
            gender: c.gender || '',
            qualification: c.qualification || '',
            year_of_passout: c.year_of_passout || '',
            department: c.department || '',
            industry: c.industry || '',
            function_unit: c.function_unit || '',
            dosage_form_area: c.dosage_form_area || '',
            experience: c.experience || '',
            present_company: c.present_company || '',
            designation: c.designation || '',
            regulatory_exposure: c.regulatory_exposure || '',
            audit_experience: c.audit_experience || '',
            current_ctc: c.current_ctc || '',
            expected_ctc: c.expected_ctc || '',
            notice_period: c.notice_period || '',
            current_location: c.current_location || '',
            preferred_location: c.preferred_location || '',
            call_remarks: c.call_remarks || '',
            shared_by: c.shared_by || '',
            extraction_status: c.extraction_status || 'Completed',
          });
        }
      } catch (err) {
        toast.error('Failed to load form details.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit]);

  const handleSubmit = async (e, forceSave = false) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const payload = { ...form, force_save: forceSave };
      if (isEdit) {
        await api.put(`/api/candidates/${id}`, payload);
        toast.success('Candidate record updated successfully!');
        navigate(`/candidates/${id}`);
      } else {
        const res = await api.post('/api/candidates', payload);
        toast.success('Candidate created successfully!');
        navigate(`/candidates/${res.data.candidate.id}`);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        // Duplicate warning triggered
        setDuplicateWarning(err.response.data);
      } else {
        toast.error(err.response?.data?.error || 'Failed to save candidate record.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading candidate details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={isEdit ? `/candidates/${id}` : '/candidates'}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEdit ? 'Edit Candidate Record' : 'Add Candidate Record'}
            </h2>
            <p className="text-xs text-slate-500">
              Structured entry mapped strictly to the fixed 24-column recruitment schema
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Personal & Contact Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            1. Candidate & Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="Full candidate name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={form.mobile_no}
                onChange={(e) => setForm({ ...form, mobile_no: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="+919876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
              <input
                type="email"
                value={form.email_id}
                onChange={(e) => setForm({ ...form, email_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                placeholder="candidate@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location</label>
              <input
                type="text"
                value={form.current_location}
                onChange={(e) => setForm({ ...form, current_location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Hyderabad"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Location</label>
              <input
                type="text"
                value={form.preferred_location}
                onChange={(e) => setForm({ ...form, preferred_location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Bangalore / Remote"
              />
            </div>
          </div>
        </div>

        {/* Professional & Experience */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            2. Professional Experience & Compensation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Experience</label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 4 years 2 months / Fresher"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Present Company</label>
              <input
                type="text"
                value={form.present_company}
                onChange={(e) => setForm({ ...form, present_company: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Dr. Reddy's Laboratories"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Executive QA"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current CTC</label>
              <input
                type="text"
                value={form.current_ctc}
                onChange={(e) => setForm({ ...form, current_ctc: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 6.5 LPA"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expected CTC</label>
              <input
                type="text"
                value={form.expected_ctc}
                onChange={(e) => setForm({ ...form, expected_ctc: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 8.5 LPA"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Period</label>
              <input
                type="text"
                value={form.notice_period}
                onChange={(e) => setForm({ ...form, notice_period: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 30 Days / Immediate"
              />
            </div>
          </div>
        </div>

        {/* Domain, Education & Exposure */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            3. Department, Function & Industry Classifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Department</option>
                {settings?.departments?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Industry</option>
                {settings?.industries?.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Function / Unit</label>
              <select
                value={form.function_unit}
                onChange={(e) => setForm({ ...form, function_unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Function/Unit</option>
                {settings?.functions?.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form / Area</label>
              <select
                value={form.dosage_form_area}
                onChange={(e) => setForm({ ...form, dosage_form_area: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Select Dosage Form/Area</option>
                {settings?.dosage_forms?.map((df) => (
                  <option key={df} value={df}>
                    {df}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. B.Pharm / M.Sc Chemistry"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year of Passout</label>
              <input
                type="text"
                value={form.year_of_passout}
                onChange={(e) => setForm({ ...form, year_of_passout: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. 2021"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Regulatory Exposure</label>
              <input
                type="text"
                value={form.regulatory_exposure}
                onChange={(e) => setForm({ ...form, regulatory_exposure: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. USFDA, MHRA, WHO-GMP inspection exposure"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Experience</label>
              <input
                type="text"
                value={form.audit_experience}
                onChange={(e) => setForm({ ...form, audit_experience: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="e.g. Faced 3 international regulatory audits as lead investigator"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Call Remarks</label>
              <textarea
                rows={3}
                value={form.call_remarks}
                onChange={(e) => setForm({ ...form, call_remarks: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Notes on communication, availability, interviewer feedback..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            to={isEdit ? `/candidates/${id}` : '/candidates'}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEdit ? 'Update Candidate' : 'Create Candidate Record'}
          </button>
        </div>
      </form>

      {/* Duplicate Warning Dialog */}
      <Modal
        isOpen={Boolean(duplicateWarning)}
        onClose={() => setDuplicateWarning(null)}
        title="Duplicate Candidate Detected"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <p className="font-semibold text-amber-900">Potential Duplicate Record Found</p>
              <p className="mt-1">{duplicateWarning?.warning}</p>
              {duplicateWarning?.existing_candidate && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                  <p className="font-semibold text-slate-800">
                    Existing Record: {duplicateWarning.existing_candidate.candidate_uid}
                  </p>
                  <p className="text-slate-600">Name: {duplicateWarning.existing_candidate.name}</p>
                  <p className="text-slate-600">Phone: {duplicateWarning.existing_candidate.mobile_no}</p>
                  <p className="text-slate-600">Email: {duplicateWarning.existing_candidate.email_id}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            {duplicateWarning?.existing_candidate && (
              <button
                type="button"
                onClick={() => {
                  const eid = duplicateWarning.existing_candidate.id;
                  setDuplicateWarning(null);
                  navigate(`/candidates/${eid}`);
                }}
                className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                Open Existing Candidate
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDuplicateWarning(null);
                handleSubmit(null, true);
              }}
              className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
            >
              Save As Separate Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
