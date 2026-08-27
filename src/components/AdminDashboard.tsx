import { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'sonner';
import { 
  Search, User, Mail, Key, Shield, FolderGit2, 
  Edit, Loader2
} from 'lucide-react';
import { cn } from '../utils';

export function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  const [assigningUser, setAssigningUser] = useState<any | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, projRes, tasksRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects'),
        api.get('/tasks')
      ]);
      setUsers(usersRes.data.data);
      setProjects(projRes.data.data);
      setTasks(tasksRes.data.data);
    } catch (err) {
      console.error('Failed to sync administrative data:', err);
      toast.error('Failed to retrieve workspace registry lists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update profile details (Name, Email, Password) and Role
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      const payload: any = {
        fullName: editName,
        email: editEmail,
        role: editingUser.role,
        isActive: editingUser.isActive,
        projectId: editingUser.projectId
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      await api.put(`/users/${editingUser.id}`, payload);
      toast.success('User credentials updated successfully');
      setEditingUser(null);
      setEditPassword('');
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update credentials';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user: any) => {
    try {
      const payload = {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: !user.isActive,
        projectId: user.projectId
      };
      await api.put(`/users/${user.id}`, payload);
      toast.success(`User account is now ${!user.isActive ? 'Active' : 'Deactivated'}`);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      toast.error(msg);
    }
  };

  // Change user role
  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      const payload = {
        fullName: user.fullName,
        email: user.email,
        role: newRole,
        isActive: user.isActive,
        projectId: user.projectId
      };
      await api.put(`/users/${user.id}`, payload);
      toast.success(`Role changed to ${newRole}`);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update role';
      toast.error(msg);
    }
  };

  // Prepare Project/Task assignment modal
  const openAssignmentModal = (user: any) => {
    setAssigningUser(user);
    setSelectedProjectId(user.projectId || '');
    
    // Find all tasks currently assigned to this user's name
    const userTasks = tasks.filter(t => t.assignee === user.fullName);
    setSelectedTaskIds(userTasks.map(t => t.id));
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Save Project/Task assignments
  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningUser) return;
    setSaving(true);
    try {
      const payload = {
        fullName: assigningUser.fullName,
        email: assigningUser.email,
        role: assigningUser.role,
        isActive: assigningUser.isActive,
        projectId: selectedProjectId || null,
        taskIds: selectedTaskIds // Backend handles unlinking and re-assignment
      };
      await api.put(`/users/${assigningUser.id}`, payload);
      toast.success('Project & Task assignments updated successfully');
      setAssigningUser(null);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save allocations';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="animate-spin text-primary h-8 w-8 mb-3" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Employee Registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 h-[250px] w-[250px] rounded-full bg-primary/5 blur-[50px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Shield size={10} />
              <span>Admin Management Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Employee Management Dashboard
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl mt-1">
              Isolated directory for system-wide profile updates, credential resets, role changes, and project/task reassignments.
            </p>
          </div>

          <div className="flex gap-2 max-w-xs w-full">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search staff directory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden flex flex-col">
        <h2 className="text-md font-bold tracking-tight mb-4">User Registry Directory</h2>
        
        <div className="overflow-x-auto pr-1">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="pb-3 pr-4">User Info</th>
                <th className="pb-3 pr-4">Active Role</th>
                <th className="pb-3 pr-4">Assigned Project</th>
                <th className="pb-3 pr-4">Active Tasks</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                    No matching personnel records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((userItem) => {
                  const assignedProj = projects.find(p => p.id === userItem.projectId);
                  const userTasksCount = tasks.filter(t => t.assignee === userItem.fullName).length;

                  return (
                    <tr key={userItem.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-foreground">{userItem.fullName}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{userItem.email}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <select
                          value={userItem.role}
                          onChange={(e) => handleChangeRole(userItem, e.target.value)}
                          className="rounded-lg border border-border bg-background/50 py-1 px-2 text-[11px] font-bold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="PROJECT_MANAGER">Project Manager</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground truncate max-w-[150px]">
                        {assignedProj ? (
                          <span className="font-semibold text-foreground">{assignedProj.name}</span>
                        ) : (
                          <span className="italic text-muted-foreground/60">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex items-center justify-center bg-secondary font-bold text-foreground rounded-full px-2 py-0.5 text-[10px]">
                          {userTasksCount} tasks
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <button
                          onClick={() => handleToggleActive(userItem)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase transition-colors cursor-pointer",
                            userItem.isActive 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", userItem.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                          {userItem.isActive ? 'Active' : 'Deactive'}
                        </button>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(userItem);
                              setEditName(userItem.fullName);
                              setEditEmail(userItem.email);
                            }}
                            className="p-2 border border-border hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Edit Credentials"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => openAssignmentModal(userItem)}
                            className="p-2 border border-border hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                            title="Reassign Project & Tasks"
                          >
                            <FolderGit2 size={13} />
                            <span>Assign</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Credentials Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-md font-bold text-foreground">Update Credentials</h3>
              <p className="text-[11px] text-muted-foreground">Modify profile settings or reset login password for {editingUser.fullName}.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Reset Password <span className="text-[9px] text-muted-foreground/60 font-medium">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setEditPassword('');
                  }}
                  className="rounded-xl border border-border hover:bg-secondary text-foreground px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project & Task Reassignment Modal */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-md font-bold text-foreground">Allocate Project & Tasks</h3>
              <p className="text-[11px] text-muted-foreground">Modify allocations for {assigningUser.fullName} ({assigningUser.role}).</p>
            </div>

            <form onSubmit={handleSaveAssignments} className="space-y-4">
              {/* Project select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Project</label>
                <div className="relative">
                  <FolderGit2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/50 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary text-foreground cursor-pointer appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>{proj.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Task checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Assigned Scope Tasks List
                </label>
                <p className="text-[10px] text-muted-foreground">Select which tasks are assigned to this employee:</p>
                
                <div className="border border-border rounded-xl bg-background/50 divide-y divide-border/60 max-h-48 overflow-y-auto pr-1">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center italic">No tasks created in system.</p>
                  ) : (
                    tasks
                      .filter(t => !selectedProjectId || t.projectId === selectedProjectId)
                      .map((task) => {
                        const isChecked = selectedTaskIds.includes(task.id);
                        return (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleTaskSelection(task.id)}
                            className="flex items-start gap-3 p-3 hover:bg-secondary/20 transition-colors cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-semibold text-foreground", isChecked && "text-primary")}>
                                {task.title}
                              </p>
                              {task.project && (
                                <span className="inline-block mt-0.5 text-[8px] font-extrabold uppercase text-muted-foreground">
                                  {task.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningUser(null)}
                  className="rounded-xl border border-border hover:bg-secondary text-foreground px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 text-xs font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  <span>Save Assignments</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
