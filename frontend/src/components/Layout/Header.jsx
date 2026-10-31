import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Database, RefreshCw, Key } from 'lucide-react';
import api from '../../services/api';

export const Header = () => {
  const { user } = useAuth();
  const [aiStatus, setAiStatus] = useState(null);
  const [checkingAi, setCheckingAi] = useState(false);

  const fetchAiStatus = async () => {
    try {
      setCheckingAi(true);
      const res = await api.get('/api/settings/ai-status');
      setAiStatus(res.data);
    } catch (err) {
      setAiStatus({ is_online: false, message: 'AI service unreachable' });
    } finally {
      setCheckingAi(false);
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">
          AI Resume & Visitor Management System
        </h1>
        <p className="text-xs text-slate-500">
          MongoDB &bull; OpenRouter AI &bull; Fixed 24-Column Excel Registry
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* MongoDB Indicator */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-medium"
          title="MongoDB is connected"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>MongoDB</span>
        </div>

        {/* OpenRouter AI Status Pill */}
        <div 
          onClick={fetchAiStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition ${
            aiStatus?.is_online
              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              : aiStatus?.is_configured
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          title="Click to check OpenRouter AI API connectivity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {aiStatus?.is_online
              ? `OpenRouter: ${aiStatus.configured_model?.split('/')?.pop() || 'Connected'}`
              : aiStatus?.is_configured
              ? 'OpenRouter (Auth Issue)'
              : 'Heuristic Pattern Mode (Configure OpenRouter in Settings)'}
          </span>
          <RefreshCw className={`w-3 h-3 ${checkingAi ? 'animate-spin' : ''}`} />
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
