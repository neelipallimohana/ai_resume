import React from 'react';

export const StatusBadge = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'Completed':
    case 'Exited':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Processing':
    case 'Uploaded':
      style = 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse';
      break;
    case 'Needs Review':
    case 'Pending':
    case 'Present':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'Failed':
    case 'Cancelled':
      style = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'Manual':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'Rescheduled':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      break;
    default:
      style = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
};
