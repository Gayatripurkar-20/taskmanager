const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, and password are required" });

    const validRoles = ["admin", "member"];
    const userRole = validRoles.includes(role) ? role : "member";

    const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users(name, email, password, role) VALUES(?,?,?,?)",
      [name, email, hashed, userRole]
    );
    res.status(201).json({ message: "User registered", user: { id: result.insertId, name, email, role: userRole } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const [rows] = await pool.query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length) return res.status(400).json({ error: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// Get all users (Admin only)
router.get("/users", require("../middleware/auth"), async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admins only" });
    const [rows] = await pool.query("SELECT id, name, email, role FROM users ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
