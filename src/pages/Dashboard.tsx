import { useAuth } from '../hooks'
import { cn } from '../utils'
import {
  FolderGit2,
  ClipboardList,
  CheckSquare,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
  FileDown,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

const computeActiveDurations = (todayLogs: any[]) => {
  let workMs = 0;
  let breakMs = 0;
  let lunchMs = 0;
  let totalElapsedMs = 0;

  if (todayLogs.length === 0) {
    return { workHours: 0, breakHours: 0, lunchHours: 0, totalHours: 0 };
  }

  // Sort logs by timestamp ascending
  const sortedLogs = [...todayLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstCheckIn = new Date(sortedLogs[0].timestamp);
  let lastEventTime = firstCheckIn;
  let previousState: 'OFF_WORK' | 'ACTIVE' | 'BREAK' | 'LUNCH' = 'OFF_WORK';

  sortedLogs.forEach((log) => {
    const logTime = new Date(log.timestamp);
    const diff = logTime.getTime() - lastEventTime.getTime();

    if (previousState === 'ACTIVE') {
      workMs += diff;
    } else if (previousState === 'BREAK') {
      breakMs += diff;
    } else if (previousState === 'LUNCH') {
      lunchMs += diff;
    }

    // Transition state
    if (log.type === 'CHECK_IN' || log.type === 'BREAK_END' || log.type === 'LUNCH_END') {
      previousState = 'ACTIVE';
    } else if (log.type === 'CHECK_OUT') {
      previousState = 'OFF_WORK';
    } else if (log.type === 'BREAK_START') {
      previousState = 'BREAK';
    } else if (log.type === 'LUNCH_START') {
      previousState = 'LUNCH';
    }

    lastEventTime = logTime;
  });

  // Add active ticking time up to now
  const now = new Date();
  if (previousState !== 'OFF_WORK') {
    const diff = now.getTime() - lastEventTime.getTime();
    if (previousState === 'ACTIVE') {
      workMs += diff;
    } else if (previousState === 'BREAK') {
      breakMs += diff;
    } else if (previousState === 'LUNCH') {
      lunchMs += diff;
    }
    
    totalElapsedMs = now.getTime() - firstCheckIn.getTime();
  } else {
    const lastCheckOut = new Date(sortedLogs[sortedLogs.length - 1].timestamp);
    totalElapsedMs = lastCheckOut.getTime() - firstCheckIn.getTime();
  }

  return {
    workHours: Math.max(0, workMs / 1000 / 3600),
    breakHours: Math.max(0, breakMs / 1000 / 3600),
    lunchHours: Math.max(0, lunchMs / 1000 / 3600),
    totalHours: Math.max(0, totalElapsedMs / 1000 / 3600),
  };
};

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Live state
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [usersCount, setUsersCount] = useState(1)
  const [, setLoading] = useState(false)

  // Status & Time Logging State
  const [todayLogs, setTodayLogs] = useState<any[]>([])
  const [dbStats, setDbStats] = useState<Record<string, any>>({})
  const [currentStatus, setCurrentStatus] = useState<string>(user?.currentStatus || 'OFF_WORK')
  
  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [myActiveTasks, setMyActiveTasks] = useState<any[]>([])
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([])
  const [projectStatusMap, setProjectStatusMap] = useState<Record<string, 'In Progress' | 'Completed'>>({})
  const [durations, setDurations] = useState({
    workHours: 0,
    breakHours: 0,
    lunchHours: 0,
    totalHours: 0,
  })

  // Managers view live states
  const [teamStatuses, setTeamStatuses] = useState<any[]>([])
  const [teamFeed, setTeamFeed] = useState<any[]>([])

  const fetchTodayLogs = async () => {
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)
      const res = await api.get(`/time-logs/today?start=${start.toISOString()}&end=${end.toISOString()}`)
      setTodayLogs(res.data.data)
    } catch (err) {
      console.error('Failed to fetch today time logs:', err)
    }
  }

  const fetchTeamActivity = async () => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'PROJECT_MANAGER') {
      try {
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        const [statusRes, feedRes] = await Promise.all([
          api.get(`/time-logs/users?start=${start.toISOString()}&end=${end.toISOString()}`),
          api.get(`/time-logs/feed?start=${start.toISOString()}&end=${end.toISOString()}`),
        ])
        setTeamStatuses(statusRes.data.data)
        setTeamFeed(feedRes.data.data)
      } catch (err) {
        console.error('Failed to fetch team status/feed:', err)
      }
    }
  }

  const syncUserStatus = async () => {
    try {
      const res = await api.get('/users/profile')
      const dbUser = res.data.data
      setCurrentStatus(dbUser.currentStatus || 'OFF_WORK')
      updateUser({ currentStatus: dbUser.currentStatus || 'OFF_WORK' })
    } catch (err) {
      console.error('Failed to sync user status on mount:', err)
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const offset = -new Date().getTimezoneOffset()
      const [projRes, tasksRes, reqsRes, statsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/requirements'),
        api.get(`/time-logs/stats?timezoneOffset=${offset}`),
      ])
      setProjects(projRes.data.data)
      setTasks(tasksRes.data.data)
      setRequirements(reqsRes.data.data)
      setDbStats(statsRes.data.data)

      if (user?.role === 'ADMIN') {
        const usersRes = await api.get('/users')
        setUsersCount(usersRes.data.data.length)
      } else {
        setUsersCount(5)
      }
    } catch (error) {
      console.error('Error fetching dashboard details:', error)
      toast.error('Failed to update live dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
      fetchTodayLogs()
      fetchTeamActivity()
      syncUserStatus()
    }
  }, [user])

  useEffect(() => {
    // Interval to calculate duration in real-time
    const interval = setInterval(() => {
      const currentDurations = computeActiveDurations(todayLogs)
      setDurations(currentDurations)
    }, 1000)

    return () => clearInterval(interval)
  }, [todayLogs, currentStatus])

  const handleStatusChange = async (type: string) => {
    try {
      const res = await api.post('/time-logs', { type })
      const newStat = res.data.data.status
      setCurrentStatus(newStat)
      updateUser({ currentStatus: newStat })
      toast.success(`Clock state updated to ${type.replace('_', ' ')}`)
      await fetchTodayLogs()
      await fetchTeamActivity()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update clock status'
      toast.error(msg)
    }
  }

  const handleCheckoutClick = () => {
    const activeTasks = tasks.filter(t => t.assignee === user?.name && t.status !== 'Completed' && t.status !== 'FINISHED')
    setMyActiveTasks(activeTasks)
    setCompletedTaskIds([])
    setCheckoutNotes('')
    
    // Initialize projectStatusMap with the current status of all my projects
    const myProjects = projects.filter(p => tasks.some(t => t.assignee === user?.name && t.projectId === p.id))
    const initialMap: Record<string, 'In Progress' | 'Completed'> = {}
    myProjects.forEach(p => {
      initialMap[p.id] = (p.status === 'Completed' ? 'Completed' : 'In Progress')
    })
    setProjectStatusMap(initialMap)
    
    setIsCheckoutModalOpen(true)
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // 1. Submit checkout time log with notes
      const res = await api.post('/time-logs', {
        type: 'CHECK_OUT',
        notes: checkoutNotes
      })

      // 2. Concurrently mark selected tasks as Completed
      if (completedTaskIds.length > 0) {
        await Promise.all(
          completedTaskIds.map(taskId =>
            api.put(`/tasks/${taskId}`, { status: 'Completed' })
          )
        )
      }

      // 3. Concurrently update all project status changes
      const projectIds = Object.keys(projectStatusMap)
      if (projectIds.length > 0) {
        await Promise.all(
          projectIds.map(projId => {
            const currentProj = projects.find(p => p.id === projId)
            const targetStatus = projectStatusMap[projId]
            if (currentProj && currentProj.status !== targetStatus) {
              return api.put(`/projects/${projId}`, {
                name: currentProj.name,
                description: currentProj.description,
                status: targetStatus
              })
            }
            return Promise.resolve()
          })
        )
      }

      const newStat = res.data.data.status
      setCurrentStatus(newStat)
      updateUser({ currentStatus: newStat })
      toast.success('Shift checked out. Daily tasks & projects review saved successfully.')
      setIsCheckoutModalOpen(false)
      
      // Refresh all
      await fetchTodayLogs()
      await fetchTeamActivity()
      await fetchDashboardData()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to check out'
      toast.error(msg)
    }
  }

  const formatDuration = (hoursDecimal: number) => {
    const totalSeconds = Math.round(hoursDecimal * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0'),
    ].join(':');
  };

  // Dynamically compute the last 5 weeks Monday-Sunday based on user's database stats
  const getDynamicWeeklyData = () => {
    const weeklyDataList = []
    const currentMonday = new Date()
    const day = currentMonday.getDay()
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1)
    currentMonday.setDate(diff)
    currentMonday.setHours(0, 0, 0, 0)

    for (let i = 4; i >= 0; i--) {
      const weekMonday = new Date(currentMonday)
      weekMonday.setDate(weekMonday.getDate() - i * 7)

      const weekSunday = new Date(weekMonday)
      weekSunday.setDate(weekSunday.getDate() + 6)

      const formatMonthDay = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}`
      }

      let weekRange = `${formatMonthDay(weekMonday)} - ${formatMonthDay(weekSunday)}`
      if (i === 0) {
        weekRange += ' (Current Week)'
      } else {
        weekRange += ` (${i} Wk${i > 1 ? 's' : ''} Ago)`
      }

      const days = []
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekMonday)
        dayDate.setDate(dayDate.getDate() + d)
        const dateStr = `${dayDate.getFullYear()}-${(dayDate.getMonth() + 1).toString().padStart(2, '0')}-${dayDate.getDate().toString().padStart(2, '0')}`

        const dayStats = dbStats[dateStr] || { work: 0, breaks: 0, lunch: 0 }
        days.push({
          day: dayNames[d],
          work: dayStats.work,
          breaks: dayStats.breaks,
          lunch: dayStats.lunch
        })
      }

      weeklyDataList.push({
        weekRange,
        days
      })
    }

    return weeklyDataList
  }

  const weeklyData = getDynamicWeeklyData()

  // Overriding today's data in the current week representation
  const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDayName = dayOfWeekNames[new Date().getDay()];

  const adjustedWeeklyData = weeklyData.map((week, idx) => {
    if (idx === 4) { // Current Week (last element)
      return {
        ...week,
        days: week.days.map((d) => {
          if (d.day === todayDayName) {
            return {
              ...d,
              work: durations.workHours,
              breaks: durations.breakHours,
              lunch: durations.lunchHours,
            };
          }
          return d;
        }),
      };
    }
    return week;
  });

  // Aggregated weekly data
  const aggregatedWeeks = adjustedWeeklyData.map((week, idx) => {
    let totalWork = 0
    let totalBreaks = 0
    let totalLunch = 0
    week.days.forEach((d) => {
      totalWork += d.work
      totalBreaks += d.breaks
      totalLunch += d.lunch
    })
    const total = totalWork + totalBreaks + totalLunch
    return {
      label: idx === 0 ? 'Current' : `${idx} Wk Ago`,
      fullRange: week.weekRange,
      work: totalWork,
      breaks: totalBreaks,
      lunch: totalLunch,
      total
    }
  }).reverse()

  if (!user) return null

  const getStats = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { name: 'Active Personnel', value: usersCount.toString(), change: 'Live Workspace', desc: 'Active security credentials', icon: Users, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Linked Milestones', value: projects.length.toString(), change: '+12% increase', desc: 'Underway scoped projects', icon: FolderGit2, color: 'text-primary bg-primary/10 border-primary/20' },
          { name: 'Tasks Completed', value: tasks.filter(t => t.status === 'Completed' || t.status === 'FINISHED').length.toString(), change: `${tasks.length} total tasks`, desc: 'Closed workspace cards', icon: CheckSquare, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Project Scope Traces', value: requirements.length.toString(), change: '100% coverage', desc: 'Traceability linked items', icon: ClipboardList, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
        ]
      case 'MANAGER':
      case 'PROJECT_MANAGER':
        return [
          { name: 'Project Registry', value: projects.length.toString(), change: 'Manager View', desc: 'Active assigned scopes', icon: FolderGit2, color: 'text-primary bg-primary/10 border-primary/20' },
          { name: 'Assigned Traces', value: requirements.length.toString(), change: 'Verification tier', desc: 'Client requirements mapped', icon: ClipboardList, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
          { name: 'Tasks Under Review', value: tasks.filter(t => t.status === 'REVIEW').length.toString(), change: 'Awaiting Signoff', desc: 'Pending manager approval', icon: CheckCircle2, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
          { name: 'Completed Scope Tasks', value: tasks.filter(t => t.status === 'Completed' || t.status === 'FINISHED').length.toString(), change: `${tasks.length} tasks allocated`, desc: 'Finished scope targets', icon: CheckSquare, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        ]
      case 'EMPLOYEE':
      default:
        const myTasks = tasks.filter(t => t.assignee === user.name)
        return [
          { name: 'My Active Tasks', value: myTasks.filter(t => t.status !== 'Completed' && t.status !== 'FINISHED').length.toString(), change: 'Action Required', desc: 'Pending developer logs', icon: ClipboardList, color: 'text-primary bg-primary/10 border-primary/20' },
          { name: 'Completed Tasks', value: myTasks.filter(t => t.status === 'Completed' || t.status === 'FINISHED').length.toString(), change: 'Work Verified', desc: 'Logged tasks finished', icon: CheckSquare, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Total Allocated Hours', value: durations.workHours.toFixed(1) + 'h', change: 'Logged today', desc: 'Accumulated active shifts', icon: Clock, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
          { name: 'Active Workspace Cards', value: tasks.length.toString(), change: 'Global tasks list', desc: 'Total tracked team items', icon: FolderGit2, color: 'text-neutral-500 bg-secondary border-border/20' },
        ]
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 h-[250px] w-[250px] rounded-full bg-primary/5 blur-[50px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={10} />
              <span>Workspace Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Hello, {user.name}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mt-1">
              Welcome back to ThinkCove. You are authenticated with{' '}
              <span className="font-semibold text-primary">{user.role}</span> privileges. Below are your live shift timers and milestone traces.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/reports" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground transition-all">
              <FileDown size={14} className="text-muted-foreground" />
              <span>Generate Reports</span>
            </Link>
            <Link to="/tasks" className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:translate-y-[-1px]">
              <Plus size={14} />
              <span>Manage Tasks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Check-in Widget */}
      {user.role !== 'ADMIN' && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 h-[180px] w-[180px] rounded-full bg-secondary/20 blur-[40px] pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <Clock size={32} className="text-primary" />
              <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card ${
                currentStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                currentStatus === 'BREAK' ? 'bg-rose-500 animate-pulse' :
                currentStatus === 'LUNCH' ? 'bg-amber-500 animate-pulse' :
                'bg-neutral-500'
              }`} />
            </div>
            <div>
              <h2 className="text-md font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Shift Status:</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                  currentStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  currentStatus === 'BREAK' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  currentStatus === 'LUNCH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-neutral-500/10 text-muted-foreground border-border'
                }`}>
                  {currentStatus.replace('_', ' ')}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentStatus === 'OFF_WORK' ? 'You are currently off-duty. Clock in to begin your day.' : 'Your working/break metrics are accumulating in real-time.'}
              </p>
            </div>
          </div>

          {/* Timers display grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/30 p-4 rounded-xl border border-border/40 relative z-10 w-full lg:w-auto">
            <div className="text-center sm:text-left min-w-[90px]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Active Work</span>
              <span className="text-sm font-black text-foreground font-mono">{formatDuration(durations.workHours)}</span>
            </div>
            <div className="text-center sm:text-left min-w-[90px]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Short Break</span>
              <span className="text-sm font-black text-rose-500 font-mono">{formatDuration(durations.breakHours)}</span>
            </div>
            <div className="text-center sm:text-left min-w-[90px]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Lunch Break</span>
              <span className="text-sm font-black text-amber-500 font-mono">{formatDuration(durations.lunchHours)}</span>
            </div>
            <div className="text-center sm:text-left min-w-[90px]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Day</span>
              <span className="text-sm font-black text-primary font-mono">{formatDuration(durations.totalHours)}</span>
            </div>
          </div>

          {/* Actions buttons */}
          <div className="flex flex-wrap gap-2.5 relative z-10">
            {currentStatus === 'OFF_WORK' && (
              <button
                onClick={() => handleStatusChange('CHECK_IN')}
                className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                Check In Shift
              </button>
            )}

            {currentStatus === 'ACTIVE' && (
              <>
                <button
                  onClick={() => handleStatusChange('BREAK_START')}
                  className="rounded-xl border border-border hover:bg-secondary text-foreground px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Start Break
                </button>
                <button
                  onClick={() => handleStatusChange('LUNCH_START')}
                  className="rounded-xl border border-border hover:bg-secondary text-foreground px-3.5 py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Go to Lunch
                </button>
                <button
                  onClick={handleCheckoutClick}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 text-xs font-bold shadow-lg shadow-rose-500/25 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  Check Out Shift
                </button>
              </>
            )}

            {currentStatus === 'BREAK' && (
              <button
                onClick={() => handleStatusChange('BREAK_END')}
                className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                Resume Work
              </button>
            )}

            {currentStatus === 'LUNCH' && (
              <button
                onClick={() => handleStatusChange('LUNCH_END')}
                className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              >
                Resume Work
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards - High Fidelity Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute top-0 left-0 h-1 w-full bg-transparent group-hover:bg-foreground transition-all duration-300" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {stat.name}
                </span>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{stat.value}</span>
                <span className="text-[11px] font-bold text-primary">{stat.change}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{stat.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Projects Progress Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Tasks Linked to Requirements */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Scope Tasks List</h2>
              <p className="text-xs text-muted-foreground">Traceability linking tasks to parent client projects.</p>
            </div>
            
            {/* Search & Filter Bar */}
            <div className="flex gap-2 max-w-xs w-full">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary transition-colors"
                />
              </div>
              <button className="p-1.5 border border-border rounded-lg bg-background hover:bg-accent text-muted-foreground">
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 pr-1 custom-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-4">Task Info</th>
                  <th className="pb-3 pr-4">Project</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {(() => {
                  const filtered = tasks.filter(
                    (t) =>
                      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground italic">
                          No matching tasks found.
                        </td>
                      </tr>
                    )
                  }
                  return filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-bold text-foreground truncate max-w-[180px]">{task.title}</div>
                        {task.requirement && (
                          <span className="inline-block text-[9px] font-bold text-primary uppercase mt-0.5">
                            REQ: {task.requirement.title.slice(0, 20)}...
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground truncate max-w-[120px]">
                        {task.project?.name || 'No Project'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase',
                            task.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : task.priority === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-neutral-500/10 text-muted-foreground border-border'
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase',
                            task.status === 'Completed' || task.status === 'FINISHED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : task.status === 'In Progress' || task.status === 'IN_PROGRESS'
                                ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          )}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            task.status === 'Completed' || task.status === 'FINISHED' ? 'bg-emerald-500' : task.status === 'In Progress' || task.status === 'IN_PROGRESS' ? 'bg-sky-500' : 'bg-amber-500'
                          }`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className="text-[11px] font-bold text-foreground">{task.assignee}</span>
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Time Allocation (Small Square Card) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between h-[400px]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Time Tracker</h2>
              <p className="text-[10px] text-muted-foreground">Aggregated weekly work, breaks, and lunch.</p>
            </div>
            <div className="text-[9px] font-extrabold text-muted-foreground bg-secondary border border-border/60 rounded px-2 py-0.5 select-none uppercase tracking-wide">
              Last 5 Weeks
            </div>
          </div>

          {/* Stacked Chart Area */}
          <div className="grid grid-cols-[24px_1fr] gap-2 h-36 pt-4 border-b border-border">
            {/* Y-axis Labels Column */}
            <div className="flex flex-col justify-between h-[78%] mt-4 text-[8px] text-muted-foreground/60 font-extrabold text-right select-none pb-0.5">
              <span>60h</span>
              <span>40h</span>
              <span>20h</span>
              <span>0h</span>
            </div>

            {/* Gridlines & Bars Area */}
            <div className="relative h-full grid grid-cols-5 gap-3">
              {/* Horizontal Reference Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5 mt-4 h-[78%]">
                <div className="border-t border-border/40 w-full" />
                <div className="border-t border-border/40 w-full" />
                <div className="border-t border-border/40 w-full" />
                <div className="border-b border-border/40 w-full" />
              </div>

              {aggregatedWeeks.map((item) => {
                const maxCapacity = 60.0
                
                const workHeight = item.total > 0 ? (item.work / maxCapacity) * 100 : 0
                const breakHeight = item.total > 0 ? (item.breaks / maxCapacity) * 100 : 0
                const lunchHeight = item.total > 0 ? (item.lunch / maxCapacity) * 100 : 0

                return (
                  <div key={item.fullRange} className="flex flex-col items-center justify-end h-full group z-10">
                    {/* Floating hour label that appears on hover */}
                    <span className="text-[8px] font-extrabold text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 mb-1 h-3 pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                      {item.total > 0 ? `${item.total.toFixed(1)}h` : ''}
                    </span>

                    {/* Visual stacked bar container */}
                    <div className="w-full max-w-[32px] flex flex-col justify-end h-[78%] relative cursor-help transition-all duration-300 border border-border/40 group-hover:border-foreground/30">
                      {lunchHeight > 0 && (
                        <div 
                          className="w-full bg-foreground/20 dark:bg-foreground/10 hover:bg-foreground/35 hover:scale-x-125 hover:scale-y-105 hover:-translate-y-0.5 hover:z-20 transition-all duration-200 cursor-help relative group/segment first:rounded-t"
                          style={{ height: `${lunchHeight}%` }}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/segment:block bg-popover text-popover-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-border shadow-md whitespace-nowrap z-50 pointer-events-none">
                            Lunch: {item.lunch.toFixed(1)}h
                          </span>
                        </div>
                      )}
                      {breakHeight > 0 && (
                        <div 
                          className="w-full bg-muted-foreground/60 dark:bg-muted-foreground/45 hover:bg-muted-foreground/80 hover:scale-x-125 hover:scale-y-105 hover:-translate-y-0.5 hover:z-20 transition-all duration-200 cursor-help relative group/segment first:rounded-t"
                          style={{ height: `${breakHeight}%` }}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/segment:block bg-popover text-popover-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-border shadow-md whitespace-nowrap z-50 pointer-events-none">
                            Break: {item.breaks.toFixed(1)}h
                          </span>
                        </div>
                      )}
                      {workHeight > 0 && (
                        <div 
                          className="w-full bg-foreground hover:bg-foreground/80 hover:scale-x-125 hover:scale-y-105 hover:-translate-y-0.5 hover:z-20 transition-all duration-200 cursor-help relative group/segment first:rounded-t"
                          style={{ height: `${workHeight}%` }}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/segment:block bg-popover text-popover-foreground text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-border shadow-md whitespace-nowrap z-50 pointer-events-none">
                            Work: {item.work.toFixed(1)}h
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-extrabold text-muted-foreground mt-2 whitespace-nowrap">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Simple Legend */}
          <div className="flex gap-2 justify-between mt-3 text-[9px] text-muted-foreground font-bold">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-foreground" />
              <span>Work</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-muted-foreground/60 dark:bg-muted-foreground/45" />
              <span>Break</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded bg-foreground/20 dark:bg-foreground/10" />
              <span>Lunch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Status and Activity Monitor for Managers */}
      {(user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'PROJECT_MANAGER') && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Status Grid */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Team Attendance Monitor</h2>
                <p className="text-xs text-muted-foreground">Real-time working/break status of all workspace staff.</p>
              </div>
              <span className="text-[10px] font-extrabold text-primary bg-primary/10 border border-primary/20 rounded px-2.5 py-0.5 select-none uppercase tracking-wide">
                Live Status
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 pr-4">Staff Name</th>
                    <th className="pb-3 pr-4">Department</th>
                    <th className="pb-3 pr-4">Role Group</th>
                    <th className="pb-3 text-right">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {teamStatuses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground italic">No team member logs detected.</td>
                    </tr>
                  ) : (
                    teamStatuses.map((member) => (
                      <tr key={member.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3 pr-4 font-bold text-foreground">{member.fullName}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{member.department || 'General'}</td>
                        <td className="py-3 pr-4 font-medium uppercase text-[10px] tracking-wide text-muted-foreground">
                          {member.role.replace('_', ' ')}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase ${
                            member.currentStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            member.currentStatus === 'BREAK' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            member.currentStatus === 'LUNCH' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-neutral-500/10 text-muted-foreground border-border'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              member.currentStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                              member.currentStatus === 'BREAK' ? 'bg-rose-500 animate-pulse' :
                              member.currentStatus === 'LUNCH' ? 'bg-amber-500 animate-pulse' :
                              'bg-neutral-400'
                            }`} />
                            {member.currentStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time feed of today's activities */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col h-[400px]">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Shift Activity Feed</h2>
              <p className="text-xs text-muted-foreground mb-4">Chronological logs of today's check-ins and breaks.</p>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-4">
              {teamFeed.length === 0 ? (
                <div className="text-xs text-muted-foreground py-16 text-center italic">No activity registered today.</div>
              ) : (
                teamFeed.map((log) => (
                  <div key={log.id} className="flex gap-3 items-start relative pb-3 border-l border-border/80 pl-4 ml-2 last:border-0 last:pb-0">
                    <div className={`absolute left-[-17px] top-1 h-2 w-2 rounded-full ring-4 ring-card ${
                      log.type === 'CHECK_IN' ? 'bg-emerald-500' :
                      log.type === 'CHECK_OUT' ? 'bg-neutral-500' :
                      log.type.includes('BREAK') ? 'bg-rose-500' :
                      'bg-amber-500'
                    }`} />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground leading-snug">
                        {log.user?.fullName || 'Someone'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {log.type === 'CHECK_IN' ? 'Checked in shift' :
                         log.type === 'CHECK_OUT' ? 'Checked out shift' :
                         log.type === 'BREAK_START' ? 'Went on a break' :
                         log.type === 'BREAK_END' ? 'Resumed work from break' :
                         log.type === 'LUNCH_START' ? 'Went to lunch' :
                         'Resumed work from lunch'}
                      </p>
                      {log.notes && (
                        <div className="mt-1.5 p-2 rounded-lg bg-secondary/60 border border-border/50 max-w-[240px] italic text-[10px] text-foreground leading-normal">
                          Daily Review: "{log.notes}"
                        </div>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 mt-1 block">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics, Activity Logs & Profile Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Right 1 Column: Active Projects Progress */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Project Health</h2>
                <p className="text-xs text-muted-foreground">Aggregated milestone progress logs.</p>
              </div>
              <TrendingUp size={20} className="text-primary" />
            </div>

            <div className="space-y-5">
              {projects.length === 0 ? (
                <div className="text-xs text-muted-foreground py-8 text-center">No projects registered.</div>
              ) : (
                projects.slice(0, 4).map((project) => {
                  const totalTasks = project.tasks?.length || 0
                  const completedTasks = project.tasks?.filter((t: any) => t.status === 'Completed' || t.status === 'FINISHED').length || 0
                  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

                  return (
                    <div key={project.id} className="space-y-2 group">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</span>
                          <span className="text-[10px] text-muted-foreground block">{project.status}</span>
                        </div>
                        <span className="font-bold text-muted-foreground">{progress}%</span>
                      </div>
                      {/* Custom progress bar */}
                      <div className="h-2 w-full rounded-full bg-accent overflow-hidden border border-border/40">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <Link to="/projects" className="flex w-full items-center justify-center gap-2 rounded-xl border border-border hover:bg-accent py-2.5 text-xs font-semibold transition-colors text-muted-foreground hover:text-foreground">
              <span>View Project Registry</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <span>Workspace Activity Log</span>
          </h2>
          <div className="space-y-4">
            {tasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex gap-4 items-start relative pb-4 border-l border-border/80 pl-4 ml-2 last:border-0 last:pb-0">
                <div className="absolute left-[-21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
                <div>
                  <p className="text-sm font-semibold">Workflow Status Change</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="font-semibold text-primary">{task.assignee}</span> updated task status to <span className="font-semibold text-foreground">{task.status}</span>.
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1.5 block">Logged in workspace</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-xs text-muted-foreground py-8 text-center">No recent activity detected.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight mb-4">Workspace Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Active User Identity</span>
              <span className="text-sm font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Authorized Role Group</span>
              <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5 uppercase tracking-wider">{user.role}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Workspace Mail</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Supervision Tier</span>
              <span className="text-sm font-semibold">{user.role === 'ADMIN' ? 'Owner / Administrator' : 'Manager Assigned'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Checkout & Task Review Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border/40 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h2 className="text-md font-bold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-rose-500" />
                <span>Shift End Review</span>
              </h2>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Daily Shift Summary / Review
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize what you accomplished today..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 py-2.5 px-3.5 text-xs outline-none focus:border-primary transition-all text-foreground resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Project Status Update
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Update the status of projects you are allocated to:
                </p>
                <div className="border border-border rounded-xl bg-background/50 divide-y divide-border/60 max-h-36 overflow-y-auto mb-4">
                  {(() => {
                    const myProjects = projects.filter(p => tasks.some(t => t.assignee === user?.name && t.projectId === p.id));
                    if (myProjects.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground p-4 text-center italic">
                          No projects currently associated with your tasks.
                        </p>
                      );
                    }
                    return myProjects.map((project) => {
                      const currentVal = projectStatusMap[project.id] || 'In Progress'
                      return (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors"
                        >
                          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                            {project.name}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setProjectStatusMap({
                                ...projectStatusMap,
                                [project.id]: 'In Progress'
                              })}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer",
                                currentVal === 'In Progress'
                                  ? "bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-sm"
                                  : "bg-secondary text-muted-foreground border-border hover:bg-accent/40"
                              )}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => setProjectStatusMap({
                                ...projectStatusMap,
                                [project.id]: 'Completed'
                              })}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer",
                                currentVal === 'Completed'
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm"
                                  : "bg-secondary text-muted-foreground border-border hover:bg-accent/40"
                              )}
                            >
                              Completed
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Active Task Status Update
                </label>
                <p className="text-[10px] text-muted-foreground">
                  Select which of your active tasks were completed today:
                </p>
                <div className="border border-border rounded-xl bg-background/50 divide-y divide-border/60 max-h-44 overflow-y-auto">
                  {myActiveTasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center italic">
                      No active tasks currently assigned to you.
                    </p>
                  ) : (
                    myActiveTasks.map((task) => {
                      const isSelected = completedTaskIds.includes(task.id)
                      return (
                        <div
                          key={task.id}
                          className="flex items-start justify-between p-3 hover:bg-secondary/20 transition-colors"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {task.title}
                            </p>
                            <span className="inline-block mt-1 text-[8px] font-bold uppercase text-muted-foreground bg-secondary px-1.5 py-0.2 rounded border border-border">
                              {task.project?.name || 'No Project'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCompletedTaskIds(completedTaskIds.filter(id => id !== task.id))}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer",
                                !isSelected
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-sm"
                                  : "bg-secondary text-muted-foreground border-border hover:bg-accent/40"
                              )}
                            >
                              Still Left (To-Do)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isSelected) {
                                  setCompletedTaskIds([...completedTaskIds, task.id])
                                }
                              }}
                              className={cn(
                                "px-2 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer",
                                isSelected
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm"
                                  : "bg-secondary text-muted-foreground border-border hover:bg-accent/40"
                              )}
                            >
                              Completed
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="rounded-xl border border-border hover:bg-secondary text-foreground px-4 py-2.5 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                >
                  Confirm & Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
