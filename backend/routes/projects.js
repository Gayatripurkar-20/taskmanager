const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// Create project (Admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Only admins can create projects" });

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required" });

    const [result] = await pool.query(
      "INSERT INTO projects(name, description, created_by) VALUES(?,?,?)",
      [name, description || "", req.user.id]
    );
    const [rows] = await pool.query("SELECT * FROM projects WHERE id=?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all projects
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id ORDER BY p.id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single project
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, u.name as creator_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.id=?",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Project not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete project (Admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Only admins can delete projects" });

    await pool.query("DELETE FROM tasks WHERE project_id=?", [req.params.id]);
    await pool.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
