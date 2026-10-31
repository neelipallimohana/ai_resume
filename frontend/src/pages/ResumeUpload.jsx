import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Edit3, 
  Check, 
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  FileArchive,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/Badge';
import { Modal } from '../components/Common/Modal';
import { useToast } from '../context/ToastContext';

export const ResumeUpload = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFilename: '' });
  const [results, setResults] = useState([]);

  // Batch download state
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Review modal state
  const [reviewCandidate, setReviewCandidate] = useState(null);
  const [reviewForm, setReviewForm] = useState({});
  const [savingReview, setSavingReview] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.name.endsWith('.pdf') || f.name.endsWith('.docx')
      );
      if (selected.length < e.target.files.length) {
        toast.warning('Some files were skipped. Only PDF and DOCX files are supported.');
      }
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.name.endsWith('.pdf') || f.name.endsWith('.docx')
      );
      if (dropped.length < e.dataTransfer.files.length) {
        toast.warning('Some files were skipped. Only PDF and DOCX files are supported.');
      }
      setFiles((prev) => [...prev, ...dropped]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleUploadAndExtract = async () => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      const totalCount = files.length;
      toast.info(`Starting bulk upload of ${totalCount} resume(s)...`);

      const batchResults = [];

      for (let i = 0; i < totalCount; i++) {
        const file = files[i];
        setProgress({
          current: i + 1,
          total: totalCount,
          currentFilename: file.name
        });

        const formData = new FormData();
        formData.append('files', file);

        try {
          const res = await api.post('/api/candidates/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const fileResults = res.data.results || [];
          batchResults.push(...fileResults);
          // Incrementally update results list so user sees each card immediately
          setResults((prev) => [...fileResults, ...prev]);
        } catch (fileErr) {
          const failedItem = {
            filename: file.name,
            status: 'Failed',
            error: fileErr.response?.data?.error || fileErr.message || 'Processing failed'
          };
          batchResults.push(failedItem);
          setResults((prev) => [failedItem, ...prev]);
        }
      }

      setFiles([]);
      toast.success(`Completed processing ${totalCount} resume(s)!`);
    } catch (err) {
      toast.error('Encountered an issue during bulk upload.');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0, currentFilename: '' });
    }
  };

  const handleBatchExportExcel = async () => {
    const validCandidateIds = results
      .filter((r) => r.candidate_id || r.candidate?.id)
      .map((r) => r.candidate_id || r.candidate.id);

    if (validCandidateIds.length === 0) {
      toast.warning('No valid candidate records in this batch to export.');
      return;
    }

    try {
      setExportingExcel(true);
      toast.info(`Exporting ${validCandidateIds.length} candidate(s) to 24-column Excel...`);
      const res = await api.post(
        '/api/candidates/export-excel',
        { candidate_ids: validCandidateIds },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_candidates_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Batch Excel workbook exported successfully!');
    } catch (err) {
      toast.error('Failed to export batch Excel workbook.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleBatchDownloadZip = async () => {
    const validCandidateIds = results
      .filter((r) => r.candidate_id || r.candidate?.id)
      .map((r) => r.candidate_id || r.candidate.id);

    if (validCandidateIds.length === 0) {
      toast.warning('No candidate resumes available in this batch for ZIP download.');
      return;
    }

    try {
      setDownloadingZip(true);
      toast.info(`Generating ZIP archive with folders organized by candidate name...`);
      const res = await api.post(
        '/api/candidates/bulk-download-zip',
        { candidate_ids: validCandidateIds },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_resumes_${new Date().toISOString().slice(0, 10)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Batch ZIP archive downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download batch ZIP archive.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const openReviewModal = (candidate) => {
    setReviewCandidate(candidate);
    setReviewForm({
      name: candidate.name || '',
      mobile_no: candidate.mobile_no || '',
      email_id: candidate.email_id || '',
      gender: candidate.gender || '',
      qualification: candidate.qualification || '',
      year_of_passout: candidate.year_of_passout || '',
      department: candidate.department || '',
      industry: candidate.industry || '',
      function_unit: candidate.function_unit || '',
      dosage_form_area: candidate.dosage_form_area || '',
      experience: candidate.experience || '',
      present_company: candidate.present_company || '',
      designation: candidate.designation || '',
      regulatory_exposure: candidate.regulatory_exposure || '',
      audit_experience: candidate.audit_experience || '',
      current_ctc: candidate.current_ctc || '',
      expected_ctc: candidate.expected_ctc || '',
      notice_period: candidate.notice_period || '',
      current_location: candidate.current_location || '',
      preferred_location: candidate.preferred_location || '',
      call_remarks: candidate.call_remarks || '',
    });
  };

  const handleSaveReview = async () => {
    if (!reviewCandidate) return;
    try {
      setSavingReview(true);
      const res = await api.put(`/api/candidates/${reviewCandidate.id}`, {
        ...reviewForm,
        extraction_status: 'Completed',
      });
      toast.success(`Candidate ${reviewCandidate.candidate_uid} review completed & saved!`);

      // Update in results table
      setResults((prev) =>
        prev.map((r) =>
          r.candidate_id === reviewCandidate.id
            ? { ...r, status: 'Completed', candidate: res.data.candidate }
            : r
        )
      );

      setReviewCandidate(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save review changes.');
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Resume Upload & Local AI Processing</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload PDF or DOCX resumes for automated structured candidate extraction using Ollama
        </p>
      </div>

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-50/50 rounded-2xl p-8 text-center cursor-pointer transition shadow-2xs group"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx"
          className="hidden"
        />
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          Click to choose resumes or drag & drop files here
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Supports multiple PDF and DOCX resumes up to 16MB each
        </p>
      </div>

      {/* Selected Files List Before Upload */}
      {files.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Selected Files ({files.length})
            </h4>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate font-medium text-slate-700">{file.name}</span>
                  <span className="text-slate-400 text-[10px]">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-slate-400 hover:text-rose-500 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Progress Bar for Bulk Upload */}
          {uploading && progress.total > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  Processing Resume {progress.current} of {progress.total}: {progress.currentFilename}
                </span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={uploading}
              onClick={handleUploadAndExtract}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing {progress.current} of {progress.total}...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Bulk Upload & Extract {files.length} Resume(s)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Batch Processing Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Batch Extraction Results ({results.length} Candidates)
              </h3>
              <p className="text-xs text-slate-500">
                Extracted records saved to database & organized by date
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={exportingExcel}
                onClick={handleBatchExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                title="Export this entire batch into a single 24-column Excel file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {exportingExcel ? 'Exporting...' : 'Export Batch to Excel'}
              </button>

              <button
                type="button"
                disabled={downloadingZip}
                onClick={handleBatchDownloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                title="Download all resumes in this batch in a ZIP with candidate-named folders"
              >
                <FileArchive className="w-3.5 h-3.5" />
                {downloadingZip ? 'Packaging ZIP...' : 'Download Batch (ZIP)'}
              </button>

              <button
                onClick={() => navigate('/candidates')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                View Registry
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resume File</th>
                  <th className="px-4 py-3">UID</th>
                  <th className="px-4 py-3">Extracted Name</th>
                  <th className="px-4 py-3">Mobile & Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notice</th>
                  <th className="px-4 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[160px]">
                      {r.filename}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.candidate_uid || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.candidate?.name || 'Not Detected'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{r.candidate?.mobile_no || '-'}</p>
                      <p className="text-[11px] text-slate-400">{r.candidate?.email_id || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      {r.is_duplicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Duplicate Warning
                        </span>
                      ) : r.error ? (
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px] block" title={r.error}>
                          {r.error}
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-[11px]">Ready</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.candidate ? (
                        <button
                          type="button"
                          onClick={() => openReviewModal(r.candidate)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Review / Edit
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Extraction Interactive Review Modal */}
      <Modal
        isOpen={Boolean(reviewCandidate)}
        onClose={() => setReviewCandidate(null)}
        title={`Review Extracted Fields: ${reviewCandidate?.candidate_uid} (${reviewCandidate?.original_filename || ''})`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Review and Verify Extracted Values</p>
              <p className="mt-0.5 text-blue-700">
                Fields missing from the resume remain blank (null). You can accept, modify, or add any details before finalizing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Candidate Name</label>
              <input
                type="text"
                value={reviewForm.name || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={reviewForm.mobile_no || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, mobile_no: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email ID</label>
              <input
                type="text"
                value={reviewForm.email_id || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, email_id: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={reviewForm.gender || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, gender: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Qualification</label>
              <input
                type="text"
                value={reviewForm.qualification || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, qualification: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Year of Passout</label>
              <input
                type="text"
                value={reviewForm.year_of_passout || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, year_of_passout: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience</label>
              <input
                type="text"
                value={reviewForm.experience || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, experience: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Present Company</label>
              <input
                type="text"
                value={reviewForm.present_company || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, present_company: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                value={reviewForm.designation || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, designation: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={reviewForm.department || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, department: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                value={reviewForm.industry || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, industry: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Function / Unit</label>
              <input
                type="text"
                value={reviewForm.function_unit || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, function_unit: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dosage Form / Area</label>
              <input
                type="text"
                value={reviewForm.dosage_form_area || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, dosage_form_area: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Location</label>
              <input
                type="text"
                value={reviewForm.current_location || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, current_location: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preferred Location</label>
              <input
                type="text"
                value={reviewForm.preferred_location || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, preferred_location: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current CTC</label>
              <input
                type="text"
                value={reviewForm.current_ctc || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, current_ctc: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected CTC</label>
              <input
                type="text"
                value={reviewForm.expected_ctc || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, expected_ctc: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
              <input
                type="text"
                value={reviewForm.notice_period || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, notice_period: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Experience</label>
              <input
                type="text"
                value={reviewForm.audit_experience || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, audit_experience: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Regulatory Exposure</label>
              <input
                type="text"
                value={reviewForm.regulatory_exposure || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, regulatory_exposure: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Call Remarks</label>
              <textarea
                rows={2}
                value={reviewForm.call_remarks || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, call_remarks: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                placeholder="Initial recruiter feedback..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setReviewCandidate(null)}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveReview}
              disabled={savingReview}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {savingReview ? 'Saving Changes...' : 'Accept & Mark Completed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
