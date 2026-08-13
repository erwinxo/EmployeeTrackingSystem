import { useAuth } from '../hooks'
import { cn } from '../utils'
import {
  FolderGit2,
  ClipboardList,
  CheckSquare,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Search,
  SlidersHorizontal,
  FileDown,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  // Live state
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [usersCount, setUsersCount] = useState(1)
  const [, setLoading] = useState(false)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [projRes, tasksRes, reqsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/requirements'),
      ])
      setProjects(projRes.data.data)
      setTasks(tasksRes.data.data)
      setRequirements(reqsRes.data.data)

      // Fetch users count only if ADMIN
      if (user?.role === 'ADMIN') {
        const usersRes = await api.get('/users')
        setUsersCount(usersRes.data.data.length)
      } else {
        setUsersCount(5) // default mockup fallback for non-admins
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
    }
  }, [user])

  // Weekly Activity Data (5 Weeks)
  const weeklyData = [
    {
      weekRange: 'Jul 28 - Aug 03 (Current Week)',
      days: [
        { day: 'Mon', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Tue', work: 7.5, breaks: 1.5, lunch: 1.0 },
        { day: 'Wed', work: 8.5, breaks: 0.5, lunch: 1.0 },
        { day: 'Thu', work: 6.0, breaks: 2.0, lunch: 1.0 },
        { day: 'Fri', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Sat', work: 2.0, breaks: 0.0, lunch: 0.0 },
        { day: 'Sun', work: 0.0, breaks: 0.0, lunch: 0.0 },
      ]
    },
    {
      weekRange: 'Jul 21 - Jul 27 (1 Week Ago)',
      days: [
        { day: 'Mon', work: 7.8, breaks: 1.2, lunch: 1.0 },
        { day: 'Tue', work: 8.2, breaks: 0.8, lunch: 1.0 },
        { day: 'Wed', work: 7.5, breaks: 1.5, lunch: 1.0 },
        { day: 'Thu', work: 9.0, breaks: 0.5, lunch: 1.5 },
        { day: 'Fri', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Sat', work: 0.0, breaks: 0.0, lunch: 0.0 },
        { day: 'Sun', work: 0.0, breaks: 0.0, lunch: 0.0 },
      ]
    },
    {
      weekRange: 'Jul 14 - Jul 20 (2 Weeks Ago)',
      days: [
        { day: 'Mon', work: 8.5, breaks: 0.5, lunch: 1.0 },
        { day: 'Tue', work: 8.0, breaks: 1.0, lunch: 1.5 },
        { day: 'Wed', work: 6.5, breaks: 2.0, lunch: 1.0 },
        { day: 'Thu', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Fri', work: 7.8, breaks: 1.2, lunch: 1.0 },
        { day: 'Sat', work: 1.5, breaks: 0.5, lunch: 0.0 },
        { day: 'Sun', work: 0.0, breaks: 0.0, lunch: 0.0 },
      ]
    },
    {
      weekRange: 'Jul 07 - Jul 13 (3 Weeks Ago)',
      days: [
        { day: 'Mon', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Tue', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Wed', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Thu', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Fri', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Sat', work: 0.0, breaks: 0.0, lunch: 0.0 },
        { day: 'Sun', work: 0.0, breaks: 0.0, lunch: 0.0 },
      ]
    },
    {
      weekRange: 'Jun 30 - Jul 06 (4 Weeks Ago)',
      days: [
        { day: 'Mon', work: 7.5, breaks: 1.5, lunch: 1.0 },
        { day: 'Tue', work: 8.5, breaks: 0.5, lunch: 1.0 },
        { day: 'Wed', work: 7.0, breaks: 2.0, lunch: 1.0 },
        { day: 'Thu', work: 8.0, breaks: 1.0, lunch: 1.0 },
        { day: 'Fri', work: 9.0, breaks: 0.0, lunch: 1.0 },
        { day: 'Sat', work: 1.0, breaks: 1.0, lunch: 0.0 },
        { day: 'Sun', work: 0.0, breaks: 0.0, lunch: 0.0 },
      ]
    }
  ]

  // Aggregated weekly data
  const aggregatedWeeks = weeklyData.map((week, idx) => {
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
          { name: 'Managed Projects', value: projects.length.toString(), change: 'Database Active', desc: 'Tracking active client targets', icon: FolderGit2, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Client Scope Items', value: requirements.length.toString(), change: 'Traced Triggers', desc: 'Scope items in requirement log', icon: ClipboardList, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Task Backlog Size', value: tasks.length.toString(), change: 'Workflow Size', desc: 'Tasks currently on board', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
        ]
      case 'MANAGER':
      case 'PROJECT_MANAGER':
        return [
          { name: 'Active Projects', value: projects.length.toString(), change: 'Database Tracked', desc: 'Assigned system allocations', icon: FolderGit2, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Scope Requirements', value: requirements.length.toString(), change: 'Traced Items', desc: 'Specifications linked to project', icon: ClipboardList, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Allocated Tasks', value: tasks.length.toString(), change: 'Workflow Active', desc: 'Tasks in tracking cycle', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Awaiting Actions', value: tasks.filter(t => t.status === 'In Progress').length.toString(), change: 'Focus Tasks', desc: 'Items currently in progress', icon: Clock, color: 'text-foreground bg-secondary border-border/20' },
        ]
      case 'EMPLOYEE':
      default:
        const myTasks = tasks.filter(t => t.assignee === user.name)
        return [
          { name: 'Your Active Tasks', value: myTasks.length.toString(), change: 'Assigned to you', desc: 'Allocated tasks in workspace', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'In Progress Tasks', value: myTasks.filter(t => t.status === 'In Progress').length.toString(), change: 'Active focus', desc: 'Working on these currently', icon: Clock, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Pending Handover', value: myTasks.filter(t => t.status === 'Pending').length.toString(), change: 'Awaiting kickoff', desc: 'Unstarted tasks queue', icon: AlertCircle, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Tasks Completed', value: myTasks.filter(t => t.status === 'Completed').length.toString(), change: 'Work done', desc: 'Finished allocations list', icon: CheckCircle2, color: 'text-foreground bg-secondary border-border/20' },
        ]
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-foreground/5 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3 py-1 text-xs font-semibold text-foreground">
              <Sparkles size={12} />
              <span>Workspace Sync Ready</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
              Hello, {user.name}
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Welcome to the workspace. You are currently viewed with{' '}
              <span className="font-semibold text-primary">{user.role}</span> permissions. Here is the analytical status for project tracking.
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
                    (task) =>
                      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (task.project?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                  )

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-sm font-bold tracking-tight text-muted-foreground/30 uppercase">No Tasks Found</span>
                            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                              We couldn't find any tasks matching "{searchTerm}". Try adding some workflow tasks.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return filtered.map((task, idx) => (
                    <tr key={task.id} className="group hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">TSK-{100 + idx}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground font-medium">{task.project?.name || 'Unassigned'}</td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider border uppercase bg-secondary text-foreground">
                          Medium
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border',
                            task.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : task.status === 'In Progress'
                              ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          )}
                        >
                          <span className={`h-1 w-1 rounded-full ${
                            task.status === 'Completed' ? 'bg-emerald-500' : task.status === 'In Progress' ? 'bg-sky-500' : 'bg-amber-500'
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
                  const completedTasks = project.tasks?.filter((t: any) => t.status === 'Completed').length || 0
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
    </div>
  )
}
