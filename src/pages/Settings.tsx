import { useState, useEffect } from 'react'
import { useAuth, useTheme } from '../hooks'
import api from '../services/api'
import { User as UserIcon, Lock as LockIcon, Palette as PaletteIcon, Shield, Laptop, Sun, Moon, Bell, Table } from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile')

  // Profile Form States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Toggle Preferences States (Local Preferences)
  const [pushAlerts, setPushAlerts] = useState(() => localStorage.getItem('ets_push_alerts') === 'true')
  const [compactTables, setCompactTables] = useState(() => localStorage.getItem('ets_compact_tables') === 'true')

  useEffect(() => {
    // Set initial values from auth state
    if (user) {
      setFullName(user.name || '')
      setEmail(user.email || '')
      setDepartment(user.department || '')
    }

    // Fetch the latest fresh user details from the backend profile endpoint
    const fetchLatestProfile = async () => {
      try {
        const response = await api.get('/users/profile')
        const data = response.data.data
        setFullName(data.fullName || data.name || '')
        setEmail(data.email || '')
        setDepartment(data.department || '')
      } catch (err) {
        console.error('Failed to sync profile info:', err)
      }
    }
    fetchLatestProfile()
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const response = await api.put('/users/profile', {
        fullName,
        email,
        department,
      })
      const updatedUser = response.data.data

      // Update local storage and context state
      updateUser({
        name: updatedUser.fullName || updatedUser.name,
        email: updatedUser.email,
        department: updatedUser.department,
      })

      toast.success('Workspace profile updated successfully')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New password verification does not match')
      return
    }
    setIsSavingPassword(true)
    try {
      await api.put('/users/change-password', {
        currentPassword,
        newPassword,
      })
      toast.success('Workspace security credentials updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password'
      toast.error(msg)
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handlePushAlertsToggle = (checked: boolean) => {
    setPushAlerts(checked)
    localStorage.setItem('ets_push_alerts', String(checked))
    toast.success(`Push alerts ${checked ? 'enabled' : 'disabled'}`)
  }

  const handleCompactTablesToggle = (checked: boolean) => {
    setCompactTables(checked)
    localStorage.setItem('ets_compact_tables', String(checked))
    toast.success(`Compact tables ${checked ? 'enabled' : 'disabled'}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Adjust profile fields, update security, and choose display configurations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="w-full md:w-60 shrink-0 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all justify-start ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <UserIcon size={14} />
            <span>Profile settings</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all justify-start ${
              activeTab === 'security'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <LockIcon size={14} />
            <span>Security & credentials</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2.5 px-4 py-3 text-xs font-bold rounded-xl transition-all justify-start ${
              activeTab === 'preferences'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <PaletteIcon size={14} />
            <span>Workspace preference</span>
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Profile Form */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-foreground">Workspace Profile</h3>
                <p className="text-xs text-muted-foreground">General settings to update your personal details in ETS.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Department Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering, Sales"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSavingProfile ? 'Saving Details...' : 'Save Profile Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Security Form */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 bg-secondary/30 p-4 rounded-xl border border-border/40 max-w-lg mb-2">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold">Credential Compliance</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Always use strong, distinct passwords. Ensure your password is at least 8 characters long, including letters, numbers, and symbols.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-bold text-foreground">Security Credentials</h3>
                <p className="text-xs text-muted-foreground">Modify login security parameters and authorization limits.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSavingPassword ? 'Updating Password...' : 'Change Credentials'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              {/* Theme Settings */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-bold text-foreground">Theme Selection</h3>
                  <p className="text-xs text-muted-foreground">Select how the Employee Tracking System interface looks on your browser.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 max-w-xl">
                  {/* Light theme option */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between min-h-[100px] cursor-pointer hover:shadow-md ${
                      theme === 'light'
                        ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Sun size={20} className={theme === 'light' ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <span className="text-xs font-bold block text-foreground">Light Mode</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Classic clean dark-on-white layout.</span>
                    </div>
                  </button>

                  {/* Dark theme option */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between min-h-[100px] cursor-pointer hover:shadow-md ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Moon size={20} className={theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <span className="text-xs font-bold block text-foreground">Dark Mode</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Modern neon glassmorphic palette.</span>
                    </div>
                  </button>

                  {/* System theme option */}
                  <button
                    onClick={() => setTheme('system')}
                    className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between min-h-[100px] cursor-pointer hover:shadow-md ${
                      theme === 'system'
                        ? 'border-primary bg-primary/[0.02] ring-1 ring-primary'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Laptop size={20} className={theme === 'system' ? 'text-primary' : 'text-muted-foreground'} />
                    <div>
                      <span className="text-xs font-bold block text-foreground">System Preferences</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">Synchronize with local OS setting.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Workspace Layout Preferences */}
              <div className="space-y-4 border-t border-border pt-6">
                <div>
                  <h3 className="text-md font-bold text-foreground">Workspace Adjustments</h3>
                  <p className="text-xs text-muted-foreground">Personalize minor display traits of workspace dashboards.</p>
                </div>

                <div className="space-y-4 max-w-xl">
                  {/* Push alerts preference */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        <Bell size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-foreground">Push Notifications</span>
                        <span className="text-[10px] text-muted-foreground">Receive real-time alerts when tasks are reassigned.</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={pushAlerts}
                        onChange={(e) => handlePushAlertsToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>

                  {/* Compact tables preference */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded-lg">
                        <Table size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-foreground">Compact Data Tables</span>
                        <span className="text-[10px] text-muted-foreground">Minimize cell padding on scope requirements lists.</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={compactTables}
                        onChange={(e) => handleCompactTablesToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
