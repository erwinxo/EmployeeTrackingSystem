import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'sonner';
import { ShieldAlert, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in as superadmin, redirect straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem('superadmin_token');
    const userStr = localStorage.getItem('superadmin_user');
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'SUPER_ADMIN') {
          navigate('/superadmin/dashboard');
        }
      } catch {
        // clear invalid data
        localStorage.removeItem('superadmin_token');
        localStorage.removeItem('superadmin_user');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      if (user.role !== 'SUPER_ADMIN') {
        toast.error('Access Denied: You do not possess Super Admin credentials.');
        setLoading(false);
        return;
      }

      // Store in isolated localStorage keys
      localStorage.setItem('superadmin_token', token);
      localStorage.setItem('superadmin_user', JSON.stringify({
        id: user.id,
        name: user.fullName || user.name,
        email: user.email,
        role: user.role
      }));

      toast.success('Authenticated as Super Administrator successfully.');
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F19] text-white p-6 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-rose-500/10 blur-[120px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4 animate-pulse">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            ThinkCove Admin Portal
          </h1>
          <p className="text-xs text-gray-400 mt-2">
            Super Administrator dynamic control gateway. Authorized personnel only.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Secure Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4.5 w-4.5" />
                <input
                  type="email"
                  required
                  placeholder="superadmin@thinkcove.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 pl-11 pr-4 text-xs text-white outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                Access Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 h-4.5 w-4.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 pl-11 pr-4 text-xs text-white outline-none focus:border-violet-500 focus:bg-white/[0.04] transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authorizing Gateway...</span>
                </>
              ) : (
                <>
                  <span>Unlock Controls</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
