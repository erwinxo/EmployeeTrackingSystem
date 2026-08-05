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
import { useState } from 'react'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

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

  // Aggregated weekly data (oldest to newest)
  const aggregatedWeeks = weeklyData.map((week) => {
    const work = week.days.reduce((sum, d) => sum + d.work, 0)
    const breaks = week.days.reduce((sum, d) => sum + d.breaks, 0)
    const lunch = week.days.reduce((sum, d) => sum + d.lunch, 0)
    const total = work + breaks + lunch
    const label = week.weekRange.split(' - ')[0]
    return {
      label,
      fullRange: week.weekRange,
      work,
      breaks,
      lunch,
      total
    }
  }).reverse()

  if (!user) return null

  // Mock projects data
  const mockProjects = [
    { id: '1', name: 'Phoenix Redesign', progress: 78, tasksCount: 12, client: 'Phoenix Corp', status: 'Active' },
    { id: '2', name: 'ERP Core Engine', progress: 42, tasksCount: 34, client: 'Global Retailers', status: 'In Progress' },
    { id: '3', name: 'iOS Tracking Client', progress: 95, tasksCount: 8, client: 'Self-Funded', status: 'Finishing' },
    { id: '4', name: 'Excel Report Parser', progress: 15, tasksCount: 6, client: 'Internal Billing', status: 'Planning' },
  ]

  // Mock tasks linked to requirements
  const mockTasks = [
    { id: 'TSK-102', title: 'Implement Client JWT Authorization', priority: 'HIGH', status: 'REVIEW', requirement: 'FR-09: Secure Endpoints', project: 'Phoenix Redesign', employee: 'John Connor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
    { id: 'TSK-104', title: 'Export Invoice to XLSX Utility', priority: 'MEDIUM', status: 'IN_PROGRESS', requirement: 'FR-12: Excel Reporting Module', project: 'ERP Core Engine', employee: 'Marcus Wright', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
    { id: 'TSK-108', title: 'Render Interactive Burn-down Chart', priority: 'HIGH', status: 'IN_PROGRESS', requirement: 'FR-03: Multi-Project Dashboard', project: 'iOS Tracking Client', employee: 'Sarah Connor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    { id: 'TSK-111', title: 'Draft API Endpoint Spec', priority: 'LOW', status: 'FINISHED', requirement: 'FR-01: Requirements Log', project: 'Excel Report Parser', employee: 'John Connor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  ]

  const getStats = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { name: 'Active Personnel', value: '18', change: '+2 new hire', desc: '14 active in projects', icon: Users, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Managed Projects', value: '8', change: '87% overall progress', desc: '2 pending client signoff', icon: FolderGit2, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Client Scope Items', value: '34', change: '+6 logged this week', desc: 'Requirements fully traced', icon: ClipboardList, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Task Backlog Size', value: '112', change: '79% completion velocity', desc: '32 items in active review', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
        ]
      case 'MANAGER':
        return [
          { name: 'Active Projects', value: '4', change: '75% avg health', desc: 'Phoenix Redesign on schedule', icon: FolderGit2, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Logged Requirements', value: '18', change: '100% trace coverage', desc: 'Linked to 42 subtasks', icon: ClipboardList, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Allocated Tasks', value: '56', change: '18 active in progress', desc: '12 completed this cycle', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Awaiting Your Review', value: '7', change: 'Requires urgent action', desc: 'Blockers detected on TSK-102', icon: Clock, color: 'text-foreground bg-secondary border-border/20' },
        ]
      case 'EMPLOYEE':
      default:
        return [
          { name: 'Your Active Tasks', value: '12', change: '2 due today', desc: 'Linked to Phoenix Redesign', icon: CheckSquare, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'In Progress Workspace', value: '6', change: 'Active focus', desc: 'Next review milestone: Fri', icon: Clock, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'In Review Queue', value: '3', change: 'Submitted to Marcus', desc: 'Awaiting manager approval', icon: AlertCircle, color: 'text-foreground bg-secondary border-border/20' },
          { name: 'Tasks Completed', value: '3', change: 'This monthly cycle', desc: 'Velocity metric: 95%', icon: CheckCircle2, color: 'text-foreground bg-secondary border-border/20' },
        ]
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Header Banner with interactive actions */}
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
            <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground transition-all">
              <FileDown size={14} className="text-muted-foreground" />
              <span>Export Reports</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/95 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:translate-y-[-1px]">
              <Plus size={14} />
              <span>Add Task</span>
            </button>
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
              <h2 className="text-lg font-bold tracking-tight">Requirement-Linked Tasks</h2>
              <p className="text-xs text-muted-foreground">Traceability linking tasks to parent client requirements.</p>
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

          <div className="overflow-x-auto overflow-y-auto flex-1 pr-1">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pr-4">Task Info</th>
                  <th className="pb-3 pr-4">Project</th>
                  <th className="pb-3 pr-4">Parent Requirement</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {(() => {
                  const filtered = mockTasks.filter(
                    (task) =>
                      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      task.project.toLowerCase().includes(searchTerm.toLowerCase())
                  )

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="text-sm font-bold tracking-tight text-muted-foreground/30 uppercase">No Tasks Found</span>
                            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                              We couldn't find any tasks matching "{searchTerm}". Try checking for spelling errors or searching other attributes.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return filtered.map((task) => (
                    <tr key={task.id} className="group hover:bg-accent/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{task.id}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground font-medium">{task.project}</td>
                      <td className="py-3.5 pr-4">
                        <span className="inline-flex items-center rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground border border-border">
                          {task.requirement}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider border',
                            task.priority === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : task.priority === 'MEDIUM'
                              ? 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                              : 'bg-muted text-muted-foreground border-border/40'
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border',
                            task.status === 'FINISHED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : task.status === 'REVIEW'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                          )}
                        >
                          <span className={`h-1 w-1 rounded-full ${
                            task.status === 'FINISHED' ? 'bg-emerald-500' : task.status === 'REVIEW' ? 'bg-amber-500' : 'bg-sky-500'
                          }`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">{task.employee}</span>
                          <img src={task.avatar} alt={task.employee} className="h-6 w-6 rounded-full object-cover border border-border" />
                        </div>
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
              {mockProjects.map((project) => (
                <div key={project.id} className="space-y-2 group">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{project.name}</span>
                      <span className="text-[10px] text-muted-foreground block">{project.client}</span>
                    </div>
                    <span className="font-bold text-muted-foreground">{project.progress}%</span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="h-2 w-full rounded-full bg-accent overflow-hidden border border-border/40">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border hover:bg-accent py-2.5 text-xs font-semibold transition-colors text-muted-foreground hover:text-foreground">
              <span>View Project Registry</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <span>Workspace Activity Log</span>
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-start relative pb-4 border-l border-border/80 pl-4 ml-2 last:border-0 last:pb-0">
              <div className="absolute left-[-21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
              <div>
                <p className="text-sm font-semibold">Logged Project Requirement</p>
                <p className="text-xs text-muted-foreground mt-0.5">Project Phoenix Redesign updated by Marcus Wright (Manager).</p>
                <span className="text-[10px] text-muted-foreground mt-1.5 block">2 hours ago</span>
              </div>
            </div>
            <div className="flex gap-4 items-start relative pb-4 border-l border-border/80 pl-4 ml-2 last:border-0 last:pb-0">
              <div className="absolute left-[-21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary ring-4 ring-card" />
              <div>
                <p className="text-sm font-semibold">Task #21 Status Change</p>
                <p className="text-xs text-muted-foreground mt-0.5">John Connor marked <span className="font-semibold text-primary">Secure Authentication</span> as REVIEW.</p>
                <span className="text-[10px] text-muted-foreground mt-1.5 block">4 hours ago</span>
              </div>
            </div>
            <div className="flex gap-4 items-start relative pl-4 ml-2">
              <div className="absolute left-[-21px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-card" />
              <div>
                <p className="text-sm font-semibold">Weekly Analytical Report Compiled</p>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically formatted, export formats (XLSX, PDF) available.</p>
                <span className="text-[10px] text-muted-foreground mt-1.5 block">Yesterday at 5:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold tracking-tight mb-4">Workspace Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Active User Identity</span>
              <div className="flex items-center gap-2">
                <img src={user.avatar} alt="" className="h-5 w-5 rounded-full object-cover border" />
                <span className="text-sm font-semibold">{user.name}</span>
              </div>
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
              <span className="text-sm text-muted-foreground">Direct Supervisor</span>
              <span className="text-sm font-semibold">{user.role === 'ADMIN' ? 'Self (Root)' : 'Sarah Connor'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
