import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
      <p className="text-slate-500 max-w-md mt-2 mb-6 text-sm">
        You do not have the required permissions to access this feature. Please contact your system administrator if you believe this is an error.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-bold text-slate-300 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-slate-800">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mt-2 mb-6 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
