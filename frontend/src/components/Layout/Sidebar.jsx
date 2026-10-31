import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  CalendarClock, 
  Building2, 
  UserCheck, 
  Settings, 
  FileText, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  User,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Candidates', path: '/candidates', icon: Users, permission: 'can_view' },
    { label: 'Upload Resumes', path: '/upload', icon: UploadCloud, permission: 'can_upload' },
    { label: 'Follow-ups', path: '/followups', icon: CalendarClock, permission: 'can_followup' },
    { label: 'OFC Visitors', path: '/visitors', icon: Building2, permission: 'can_visitors' },
    { label: 'Employees', path: '/employees', icon: UserCheck, adminOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings, adminOnly: true },
    { label: 'Activity Logs', path: '/activity-logs', icon: FileText, adminOnly: true },
  ];

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.permission && user?.role !== 'admin') {
      return Boolean(user?.permissions?.[item.permission]);
    }
    return true;
  });

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md shadow-blue-900/30">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="font-semibold text-white text-base tracking-tight truncate">
              TalentPulse AI
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/30">
            <Briefcase className="w-4 h-4" />
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle when in collapsed mode */}
      {isCollapsed && (
        <div className="p-3 border-t border-slate-800 flex justify-center">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <p className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</p>
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
