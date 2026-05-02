import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to: "", due_date: "" });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    fetchProjects();
    fetchStats();
    if (isAdmin) fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/api/projects`, { headers: authHeader() });
      setProjects(res.data);
    } catch { logout(); }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/api/tasks/dashboard/stats`, { headers: authHeader() });
      setStats(res.data.stats);
      setRecentTasks(res.data.recentTasks);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/auth/users`, { headers: authHeader() });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTasks = async (projectId) => {
    try {
      const res = await axios.get(`${API}/api/tasks/project/${projectId}`, { headers: authHeader() });
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const createProject = async () => {
    try {
      await axios.post(`${API}/api/projects`, newProject, { headers: authHeader() });
      setNewProject({ name: "", description: "" });
      setShowProjectForm(false);
      fetchProjects();
    } catch (err) { setError(err.response?.data?.error || "Failed to create project"); }
  };

  const createTask = async () => {
    try {
      await axios.post(`${API}/api/tasks`, { ...newTask, project_id: selectedProject.id }, { headers: authHeader() });
      setNewTask({ title: "", description: "", assigned_to: "", due_date: "" });
      setShowTaskForm(false);
      fetchTasks(selectedProject.id);
      fetchStats();
    } catch (err) { setError(err.response?.data?.error || "Failed to create task"); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await axios.put(`${API}/api/tasks/${taskId}`, { status }, { headers: authHeader() });
      fetchTasks(selectedProject.id);
      fetchStats();
    } catch (err) { setError(err.response?.data?.error || "Failed to update task"); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    try {
      await axios.delete(`${API}/api/projects/${id}`, { headers: authHeader() });
      if (selectedProject?.id === id) setSelectedProject(null);
      fetchProjects();
      fetchStats();
    } catch (err) { setError(err.response?.data?.error || "Failed to delete project"); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const statusColor = { todo: "#f59e0b", in_progress: "#3b82f6", done: "#10b981" };
  const statusLabel = { todo: "To Do", in_progress: "In Progress", done: "Done" };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.logo}>🗂️ Task Manager</h1>
        <div style={styles.headerRight}>
          <span style={styles.userInfo}>👤 {user.name} <span style={styles.badge}>{user.role}</span></span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {error && <div style={styles.error} onClick={() => setError("")}>{error} ✕</div>}

      {/* Stats */}
      {stats && (
        <div style={styles.statsRow}>
          {[
            { label: "Total Tasks", value: stats.total, color: "#6366f1" },
            { label: "To Do", value: stats.todo, color: "#f59e0b" },
            { label: "In Progress", value: stats.in_progress, color: "#3b82f6" },
            { label: "Done", value: stats.done, color: "#10b981" },
            { label: "Overdue", value: stats.overdue, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: s.color }}>{s.value}</div>
              <div style={{ color: "#666", fontSize: "13px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.body}>
        {/* Projects Panel */}
        <div style={styles.sidebar}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Projects</h2>
            {isAdmin && (
              <button style={styles.addBtn} onClick={() => setShowProjectForm(!showProjectForm)}>+ New</button>
            )}
          </div>

          {showProjectForm && isAdmin && (
            <div style={styles.form}>
              <input style={styles.formInput} placeholder="Project name*" value={newProject.name}
                onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
              <input style={styles.formInput} placeholder="Description" value={newProject.description}
                onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
              <div style={styles.formActions}>
                <button style={styles.saveBtn} onClick={createProject}>Create</button>
                <button style={styles.cancelBtn} onClick={() => setShowProjectForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {projects.length === 0 && <p style={styles.empty}>No projects yet</p>}
          {projects.map(p => (
            <div
              key={p.id}
              style={{ ...styles.projectItem, background: selectedProject?.id === p.id ? "#e0e7ff" : "#f9fafb" }}
              onClick={() => { setSelectedProject(p); fetchTasks(p.id); setShowTaskForm(false); }}
            >
              <div style={{ fontWeight: "600" }}>{p.name}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{p.description}</div>
              {isAdmin && (
                <button style={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteProject(p.id); }}>🗑</button>
              )}
            </div>
          ))}
        </div>

        {/* Tasks Panel */}
        <div style={styles.main}>
          {!selectedProject ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "60px" }}>📋</div>
              <p>Select a project to view tasks</p>
              {recentTasks.length > 0 && (
                <>
                  <h3>Recent Tasks</h3>
                  {recentTasks.slice(0, 5).map(t => (
                    <div key={t.id} style={styles.recentTask}>
                      <span>{t.title}</span>
                      <span style={{ ...styles.statusBadge, background: statusColor[t.status] || "#aaa" }}>
                        {statusLabel[t.status] || t.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <>
              <div style={styles.panelHeader}>
                <h2 style={styles.panelTitle}>📁 {selectedProject.name}</h2>
                {isAdmin && (
                  <button style={styles.addBtn} onClick={() => setShowTaskForm(!showTaskForm)}>+ Task</button>
                )}
              </div>

              {showTaskForm && isAdmin && (
                <div style={styles.form}>
                  <input style={styles.formInput} placeholder="Task title*" value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  <input style={styles.formInput} placeholder="Description" value={newTask.description}
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                  <select style={styles.formInput} value={newTask.assigned_to}
                    onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                  <input style={styles.formInput} type="date" value={newTask.due_date}
                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                  <div style={styles.formActions}>
                    <button style={styles.saveBtn} onClick={createTask}>Create Task</button>
                    <button style={styles.cancelBtn} onClick={() => setShowTaskForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {tasks.length === 0 && <p style={styles.empty}>No tasks yet. {isAdmin ? "Add one above!" : ""}</p>}

              {["todo", "in_progress", "done"].map(col => {
                const colTasks = tasks.filter(t => t.status === col);
                return (
                  <div key={col} style={styles.column}>
                    <h3 style={{ ...styles.colHeader, color: statusColor[col] }}>
                      {statusLabel[col]} ({colTasks.length})
                    </h3>
                    {colTasks.map(t => (
                      <div key={t.id} style={styles.taskCard}>
                        <div style={styles.taskTitle}>{t.title}</div>
                        {t.description && <div style={styles.taskDesc}>{t.description}</div>}
                        <div style={styles.taskMeta}>
                          👤 {t.assignee_name || "Unassigned"}
                          {t.due_date && <span style={{ marginLeft: "8px", color: new Date(t.due_date) < new Date() && t.status !== "done" ? "#ef4444" : "#888" }}>
                            📅 {new Date(t.due_date).toLocaleDateString()}
                          </span>}
                        </div>
                        {(isAdmin || t.assigned_to === user.id) && (
                          <select
                            style={styles.statusSelect}
                            value={t.status}
                            onChange={e => updateStatus(t.id, e.target.value)}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f0f2f5", fontFamily: "sans-serif" },
  header: { background: "#4f46e5", color: "#fff", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { margin: 0, fontSize: "20px" },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  userInfo: { fontSize: "14px" },
  badge: { background: "#fff", color: "#4f46e5", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", marginLeft: "6px" },
  logoutBtn: { background: "transparent", border: "1px solid #fff", color: "#fff", padding: "6px 14px", borderRadius: "6px", cursor: "pointer" },
  error: { background: "#fee2e2", color: "#b91c1c", padding: "12px 24px", cursor: "pointer" },
  statsRow: { display: "flex", gap: "16px", padding: "20px 24px", overflowX: "auto" },
  statCard: { background: "#fff", borderRadius: "10px", padding: "16px 24px", minWidth: "120px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  body: { display: "flex", gap: "0", height: "calc(100vh - 180px)" },
  sidebar: { width: "280px", background: "#fff", borderRight: "1px solid #e5e7eb", overflowY: "auto", padding: "16px" },
  main: { flex: 1, padding: "16px", overflowY: "auto" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  panelTitle: { margin: 0, fontSize: "18px" },
  addBtn: { background: "#4f46e5", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" },
  form: { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", marginBottom: "16px" },
  formInput: { width: "100%", padding: "8px", marginBottom: "8px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" },
  formActions: { display: "flex", gap: "8px" },
  saveBtn: { background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" },
  cancelBtn: { background: "#6b7280", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" },
  projectItem: { padding: "12px", borderRadius: "8px", marginBottom: "8px", cursor: "pointer", position: "relative", transition: "background 0.2s" },
  deleteBtn: { position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "14px" },
  empty: { color: "#9ca3af", textAlign: "center", padding: "20px 0" },
  emptyState: { textAlign: "center", color: "#9ca3af", paddingTop: "60px" },
  recentTask: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f9fafb", borderRadius: "6px", marginBottom: "6px", maxWidth: "400px", margin: "0 auto 6px" },
  statusBadge: { color: "#fff", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" },
  column: { marginBottom: "24px" },
  colHeader: { fontSize: "15px", fontWeight: "600", marginBottom: "8px" },
  taskCard: { background: "#fff", borderRadius: "8px", padding: "14px", marginBottom: "10px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  taskTitle: { fontWeight: "600", marginBottom: "4px" },
  taskDesc: { fontSize: "13px", color: "#555", marginBottom: "6px" },
  taskMeta: { fontSize: "12px", color: "#888", marginBottom: "8px" },
  statusSelect: { fontSize: "13px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" },
};
