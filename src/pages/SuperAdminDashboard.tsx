import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { Shield, LogOut, MessageSquare, BarChart, CheckSquare, Loader2 } from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Super Administrator');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [features, setFeatures] = useState({
    FEATURE_CHAT: true,
    FEATURE_REPORTS: true,
    FEATURE_TASKS: true,
  });

  // Verify Super Admin access and fetch current features status
  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    const userStr = localStorage.getItem('superadmin_user');
    
    if (!token || !userStr) {
      toast.error('Session expired. Please re-authenticate.');
      navigate('/superadmin/login');
      return;
    }

    try {
      const u = JSON.parse(userStr);
      if (u.role !== 'SUPER_ADMIN') {
        toast.error('Unauthorized access.');
        navigate('/superadmin/login');
        return;
      }
      setAdminName(u.name);
    } catch {
      navigate('/superadmin/login');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await api.get('/settings/features');
        if (res.data.success) {
          setFeatures(res.data.data);
        }
      } catch (err) {
        console.error('Failed to sync feature flags:', err);
        toast.error('Failed to retrieve system settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [navigate]);

  const handleToggle = async (key: 'FEATURE_CHAT' | 'FEATURE_REPORTS' | 'FEATURE_TASKS') => {
    const targetValue = !features[key];
    setUpdating(key);
    try {
      const res = await api.put('/settings/features', { key, value: targetValue });
      if (res.data.success) {
        setFeatures((prev) => ({ ...prev, [key]: targetValue }));
        toast.success(`Module settings modified successfully.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to modify setting';
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    toast.success('Logged out from Administrator session.');
    navigate('/superadmin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0B0F19] text-white">
        <Loader2 className="animate-spin text-violet-500 h-10 w-10 mb-4" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Syncing Control Panel...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F19] text-white p-6 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-violet-600/5 blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-rose-500/5 blur-[150px]" />

      <div className="max-w-4xl mx-auto relative z-10 pt-8">
        {/* Navbar */}
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center shadow-md shadow-violet-500/10">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white">Super Admin Dashboard</h1>
              <p className="text-[10px] text-gray-400">Authenticated: {adminName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 border border-white/[0.08] hover:bg-white/[0.04] rounded-xl text-xs text-rose-400 font-semibold cursor-pointer transition-all"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Global Feature Flag Management</h2>
          <p className="text-xs text-gray-400 mt-1 leading-snug">
            Turn core platform features on or off in real-time. Changes propagate instantly to active workspaces.
          </p>
        </div>

        {/* Features Toggles List */}
        <div className="grid gap-6 sm:grid-cols-3">
          {/* Messaging (E2EE Chat) */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl w-fit mb-4">
                <MessageSquare size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">Messaging (E2EE Chat)</h3>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                Enables secure End-to-End Encrypted chat lists and user communication channels.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-6">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                features.FEATURE_CHAT ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {features.FEATURE_CHAT ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={updating === 'FEATURE_CHAT'}
                  checked={features.FEATURE_CHAT}
                  onChange={() => handleToggle('FEATURE_CHAT')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-rose-500 disabled:opacity-50" />
              </label>
            </div>
          </div>

          {/* Reports */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit mb-4">
                <BarChart size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">Reports</h3>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                Enables report generation and download of attendance and shift performance CSVs/PDFs.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-6">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                features.FEATURE_REPORTS ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {features.FEATURE_REPORTS ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={updating === 'FEATURE_REPORTS'}
                  checked={features.FEATURE_REPORTS}
                  onChange={() => handleToggle('FEATURE_REPORTS')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-rose-500 disabled:opacity-50" />
              </label>
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <CheckSquare size={22} />
              </div>
              <h3 className="text-sm font-bold text-white">Tasks</h3>
              <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                Enables creation, update, progress status monitoring, and assignment of workspace tasks.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 mt-6">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                features.FEATURE_TASKS ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {features.FEATURE_TASKS ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={updating === 'FEATURE_TASKS'}
                  checked={features.FEATURE_TASKS}
                  onChange={() => handleToggle('FEATURE_TASKS')}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-rose-500 disabled:opacity-50" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
