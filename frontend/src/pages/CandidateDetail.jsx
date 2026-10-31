import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  FileArchive, 
  FileText, 
  Edit, 
  CalendarClock, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  GraduationCap,
  Clock,
  Layers,
  ShieldAlert,
  FileSpreadsheet,
  LayoutGrid
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EXCEL_SCHEMA_COLUMNS = [
  { col: 'A', name: 'S.No', key: 's_no', desc: 'Auto-generated sequence' },
  { col: 'B', name: 'Date', key: 'date', desc: 'Creation date in DD-MM-YYYY' },
  { col: 'C', name: 'Name', key: 'name', desc: 'Candidate full name' },
  { col: 'D', name: 'Mobile.no', key: 'mobile_no', desc: 'Contact mobile number' },
  { col: 'E', name: 'Email ID', key: 'email_id', desc: 'Primary email address' },
  { col: 'F', name: 'Gender', key: 'gender', desc: 'Gender identity' },
  { col: 'G', name: 'Qualification', key: 'qualification', desc: 'Degree / Academic credential' },
  { col: 'H', name: 'Year of passout', key: 'year_of_passout', desc: 'Year degree completed' },
  { col: 'I', name: 'Department', key: 'department', desc: 'Department specialization' },
  { col: 'J', name: 'Industry', key: 'industry', desc: 'Industry domain' },
  { col: 'K', name: 'Function/Unit', key: 'function_unit', desc: 'Functional unit' },
  { col: 'L', name: 'Dosage form / area', key: 'dosage_form_area', desc: 'Dosage form or work area' },
  { col: 'M', name: 'Experience', key: 'experience', desc: 'Total professional experience' },
  { col: 'N', name: 'Present company', key: 'present_company', desc: 'Current employer' },
  { col: 'O', name: 'Designation', key: 'designation', desc: 'Current job title' },
  { col: 'P', name: 'Regulatory exposure', key: 'regulatory_exposure', desc: 'Regulatory bodies exposure' },
  { col: 'Q', name: 'Audit experience', key: 'audit_experience', desc: 'Audit facing experience' },
  { col: 'R', name: 'Current CTC', key: 'current_ctc', desc: 'Current salary / CTC' },
  { col: 'S', name: 'Expected CTC', key: 'expected_ctc', desc: 'Expected salary / CTC' },
  { col: 'T', name: 'Notice Period', key: 'notice_period', desc: 'Notice period duration' },
  { col: 'U', name: 'Current location', key: 'current_location', desc: 'Present city / location' },
  { col: 'V', name: 'Preferred location', key: 'preferred_location', desc: 'Relocation preferences' },
  { col: 'W', name: 'Shared By', key: 'shared_by', desc: 'Uploading recruiter / user' },
  { col: 'X', name: 'Call remarks', key: 'call_remarks', desc: 'Recruiter call notes & remarks' }
];

export const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  const [candidate, setCandidate] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingAI, setRetryingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('schema'); // 'schema' | 'overview'

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      const [cRes, fRes] = await Promise.all([
        api.get(`/api/candidates/${id}`),
        api.get(`/api/followups?candidate_id=${id}`),
      ]);
      setCandidate(cRes.data.candidate);
      setFollowups(fRes.data.followups || []);
    } catch (err) {
      toast.error('Failed to load candidate record.');
      navigate('/candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateDetails();
  }, [id]);

  const handleRetryExtraction = async () => {
    try {
      setRetryingAI(true);
      toast.info('Sending resume text to local AI extraction engine...');
      const res = await api.post(`/api/candidates/${id}/retry-extraction`);
      setCandidate(res.data.candidate);
      toast.success('AI extraction reprocessed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI extraction failed.');
    } finally {
      setRetryingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm">Retrieving candidate profile...</p>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {candidate.name || 'Unnamed Candidate'}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                {candidate.candidate_uid}
              </span>
              <StatusBadge status={candidate.extraction_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered on {candidate.date} &bull; Shared By: {candidate.shared_by || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('can_edit') && (
            <Link
              to={`/candidates/${candidate.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Record
            </Link>
          )}

          {hasPermission('can_download') && candidate.stored_filename && (
            <a
              href={`/api/candidates/${candidate.id}/download-resume`}
              download
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              Original Resume
            </a>
          )}

          {hasPermission('can_download') && (
            <a
              href={`/api/candidates/${candidate.id}/download-zip`}
              download
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <FileArchive className="w-3.5 h-3.5" />
              Download Candidate ZIP
            </a>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exact 24-Column Excel Schema View (Cols A - X)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Categorized Card View
          </button>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Excel Export Match: 24/24 Strict Columns
        </span>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Either 24 Schema Table or Categorized Cards */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'schema' ? (
            /* Strict 24-Column Table View */
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Exact 24-Column Excel Schema (Row View)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guaranteed 1:1 match with exported .xlsx format (Columns A through X)
                  </p>
                </div>
                {hasPermission('can_edit') && (
                  <Link
                    to={`/candidates/${candidate.id}/edit`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Values
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">Col</th>
                      <th className="px-4 py-3 w-48">Excel Column Header</th>
                      <th className="px-4 py-3">Extracted Candidate Value</th>
                      <th className="px-4 py-3 w-28 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {EXCEL_SCHEMA_COLUMNS.map((item) => {
                      const val = candidate[item.key];
                      const hasVal = val !== null && val !== undefined && val !== '' && val !== '-';
                      return (
                        <tr key={item.col} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-blue-700 bg-blue-50/40">
                            {item.col}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-slate-800 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400">{item.desc}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {hasVal ? (
                              <span className="font-medium text-slate-900 select-all">{val}</span>
                            ) : (
                              <span className="text-slate-300 italic text-xs">Blank</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {hasVal ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Populated
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Empty
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Categorized Card View */
            <div className="space-y-6">
              {/* Section 1: Personal & Contact */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Candidate & Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Full Name (Col C)</span>
                    <span className="font-semibold text-slate-800 text-sm">{candidate.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Gender (Col F)</span>
                    <span className="font-medium text-slate-700">{candidate.gender || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Mobile Number (Col D)</span>
                    <span className="font-mono font-medium text-slate-800">{candidate.mobile_no || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email ID (Col E)</span>
                    <span className="font-medium text-blue-600">{candidate.email_id || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Current Location (Col U)</span>
                    <span className="font-medium text-slate-700">{candidate.current_location || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Preferred Location (Col V)</span>
                    <span className="font-medium text-slate-700">{candidate.preferred_location || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Professional & Experience */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Experience & Current Employment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Experience (Col M)</span>
                    <span className="font-semibold text-slate-800">{candidate.experience || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Present Company (Col N)</span>
                    <span className="font-semibold text-slate-800">{candidate.present_company || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Designation (Col O)</span>
                    <span className="font-medium text-slate-700">{candidate.designation || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Notice Period (Col T)</span>
                    <span className="font-medium text-slate-700">{candidate.notice_period || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Current CTC (Col R)</span>
                    <span className="font-medium text-slate-700">{candidate.current_ctc || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Expected CTC (Col S)</span>
                    <span className="font-medium text-slate-700">{candidate.expected_ctc || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Domain, Department & Technical Exposure */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Domain & Technical Classifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Department (Col I)</span>
                    <span className="font-medium text-slate-800">{candidate.department || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Industry (Col J)</span>
                    <span className="font-medium text-slate-800">{candidate.industry || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Function / Unit (Col K)</span>
                    <span className="font-medium text-slate-800">{candidate.function_unit || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Dosage Form / Area (Col L)</span>
                    <span className="font-medium text-slate-800">{candidate.dosage_form_area || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Qualification (Col G)</span>
                    <span className="font-medium text-slate-800">{candidate.qualification || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Year of Passout (Col H)</span>
                    <span className="font-medium text-slate-800">{candidate.year_of_passout || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Regulatory Exposure (Col P)</span>
                    <span className="font-medium text-slate-700">{candidate.regulatory_exposure || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Audit Experience (Col Q)</span>
                    <span className="font-medium text-slate-700">{candidate.audit_experience || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Call Remarks (Col X)</span>
                    <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {candidate.call_remarks || 'No call remarks recorded.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): AI Engine & Storage Metadata & Follow-up History */}
        <div className="space-y-6">
          {/* AI & File Diagnostics */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Resume & AI Diagnostics</span>
              <StatusBadge status={candidate.extraction_status} />
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Original Filename:</span>
                <span className="font-mono text-slate-700 break-all">{candidate.original_filename || 'Manual Entry'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Storage Folder:</span>
                <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-sm block">
                  {candidate.storage_folder || `candidates/${candidate.candidate_uid}`}
                </span>
              </div>
              {candidate.file_size_bytes && (
                <div>
                  <span className="text-slate-400 block">File Size:</span>
                  <span className="font-medium text-slate-700">{(candidate.file_size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              )}
              {candidate.extraction_error && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Notice
                  </div>
                  {candidate.extraction_error}
                </div>
              )}
            </div>

            {candidate.stored_filename && (
              <button
                onClick={handleRetryExtraction}
                disabled={retryingAI}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retryingAI ? 'animate-spin' : ''}`} />
                {retryingAI ? 'Processing via OpenRouter AI...' : 'Retry AI Extraction'}
              </button>
            )}
          </div>

          {/* Follow-up Timeline */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                Follow-up Activity
              </h3>
              <span className="text-xs text-slate-400">{followups.length} recorded</span>
            </div>

            {followups.length > 0 ? (
              <div className="space-y-3">
                {followups.map((f) => (
                  <div key={f.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{f.follow_up_type}</span>
                      <StatusBadge status={f.status} />
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      {f.follow_up_date} {f.follow_up_time ? `at ${f.follow_up_time}` : ''} &bull; Assigned: {f.assigned_to_name}
                    </p>
                    {f.notes && <p className="text-slate-700 italic pt-1">{f.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No follow-ups recorded yet for this candidate.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
