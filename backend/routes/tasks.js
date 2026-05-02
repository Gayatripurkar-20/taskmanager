const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// Create task (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create tasks" });
    }
    const { title, description, project_id, assigned_to, due_date } = req.body;
    if (!title || !project_id) {
      return res.status(400).json({ error: "Title and project_id are required" });
    }
    const result = await pool.query(
      "INSERT INTO tasks(title, description, project_id, assigned_to, due_date, status) VALUES($1,$2,$3,$4,$5,'todo') RETURNING *",
      [title, description || "", project_id, assigned_to || null, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update task status (assigned member or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["todo", "in_progress", "done"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status. Use: todo, in_progress, done" });
    }

    // Members can only update tasks assigned to them
    const task = await pool.query("SELECT * FROM tasks WHERE id=$1", [req.params.id]);
    if (!task.rows.length) return res.status(404).json({ error: "Task not found" });

    if (req.user.role !== "admin" && task.rows[0].assigned_to !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this task" });
    }

    const result = await pool.query(
      "UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get tasks by project
router.get("/project/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assignee_name 
       FROM tasks t 
       LEFT JOIN users u ON t.assigned_to = u.id 
       WHERE t.project_id=$1 
       ORDER BY t.id DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get dashboard stats (all tasks summary)
router.get("/dashboard/stats", auth, async (req, res) => {
  try {
    let taskQuery, params;
    if (req.user.role === "admin") {
      taskQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status='todo') as todo,
          COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status='done') as done,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue
        FROM tasks
      `;
      params = [];
    } else {
      taskQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status='todo') as todo,
          COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status='done') as done,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') as overdue
        FROM tasks WHERE assigned_to=$1
      `;
      params = [req.user.id];
    }
    const stats = await pool.query(taskQuery, params);

    const recentTasks = await pool.query(
      `SELECT t.*, u.name as assignee_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ${req.user.role !== "admin" ? "WHERE t.assigned_to=$1" : ""}
       ORDER BY t.id DESC LIMIT 10`,
      req.user.role !== "admin" ? [req.user.id] : []
    );

    res.json({ stats: stats.rows[0], recentTasks: recentTasks.rows });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
