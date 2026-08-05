import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import type { UserRole } from '../types'
import { KeyRound, Mail, ShieldAlert, Sparkles, LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('EMPLOYEE')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Please specify your registered email address')
      return
    }
    setError('')
    setLoading(true)
    try {
      await login(email, role)
      navigate('/dashboard')
    } catch (err) {
      setError('System authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#090a0f] px-4 overflow-hidden">
      {/* Background soft glowing design elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[80px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <div className="relative w-full max-w-lg rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold text-primary border border-primary/20 uppercase tracking-widest mb-4">
            <Sparkles size={10} />
            <span>Corporate Gateway</span>
          </div>
          
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-violet-500 text-primary-foreground font-black text-3xl shadow-xl shadow-primary/20">
            E
          </div>
          
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white">
            Workspace Access
          </h1>
          <p className="mt-2 text-xs text-muted-foreground max-w-xs">
            Authenticate to sync your project allocations, requirements tracing, and report compilation.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-destructive/10 p-3.5 text-xs text-destructive font-semibold border border-destructive/20">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">
              Identity Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-background/50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:bg-background/80 transition-all text-white placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">
              Privilege Level
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-2xl border border-border/80 bg-background/50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:bg-background/80 cursor-pointer transition-all text-white appearance-none"
              >
                <option value="EMPLOYEE" className="bg-[#121318]">Employee Profile (John Connor)</option>
                <option value="MANAGER" className="bg-[#121318]">Manager Profile (Marcus Wright)</option>
                <option value="ADMIN" className="bg-[#121318]">Administrator Profile (Sarah Connor)</option>
              </select>
              {/* Custom arrow down for select */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground text-xs font-bold">
                ▼
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary/20 hover:shadow-primary/35 hover:opacity-95 transition-all disabled:opacity-50 mt-8 hover:translate-y-[-1px]"
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating Session...' : 'Enter Workspace'}</span>
          </button>
        </form>

        <div className="mt-8 border-t border-border/20 pt-6 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Secure connection enabled. Subject to corporate security monitoring.
          </p>
        </div>
      </div>
    </div>
  )
}
