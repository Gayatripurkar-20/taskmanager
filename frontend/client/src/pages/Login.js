import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup ? form : { email: form.email, password: form.password };
      const res = await axios.post(`${API}${endpoint}`, payload);
      if (!isSignup) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        setIsSignup(false);
        setForm({ name: "", email: form.email, password: "", role: "member" });
        setError("Registered successfully! Please log in.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🗂️ Task Manager</h1>
        <h2 style={styles.subtitle}>{isSignup ? "Create Account" : "Sign In"}</h2>

        {error && (
          <p style={{ ...styles.message, color: error.includes("success") ? "green" : "red" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              style={styles.input}
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {isSignup && (
            <select
              style={styles.input}
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span style={styles.link} onClick={() => { setIsSignup(!isSignup); setError(""); }}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" },
  card: { background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" },
  title: { textAlign: "center", marginBottom: "4px", fontSize: "28px" },
  subtitle: { textAlign: "center", marginBottom: "20px", color: "#555", fontWeight: "400" },
  input: { width: "100%", padding: "12px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "16px", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" },
  message: { textAlign: "center", marginBottom: "12px" },
  toggle: { textAlign: "center", marginTop: "16px", color: "#555" },
  link: { color: "#4f46e5", cursor: "pointer", textDecoration: "underline" }
};
