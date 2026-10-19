import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // FIXED: Switch to absolute localhost mapping to prevent internal OS container routing shifts
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("userRole", result.user.role);
        
        alert(`Welcome back, ${result.user.name}!`);
        
        if (result.user.role === "restaurant_owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/restaurants");
        }
      } else {
        setError(result.message || "Invalid login credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect directly to the authentication backend. Ensure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "400px", margin: "50px auto", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>Account Login</h2>
      {error && <p style={{ padding: "10px", backgroundColor: "#ffebee", color: "red", borderRadius: "4px", fontSize: "13px", fontWeight: "bold" }}>{error}</p>}
      
      <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#555" }}>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }} placeholder="Enter your email" required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: "bold", marginBottom: "5px", color: "#555" }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }} placeholder="Enter password" required />
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", backgroundColor: loading ? "#aaa" : "#8B2222", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Verifying..." : "Login to Khao to Jano"}
        </button>
      </form>
    </main>
  );
}

export default Login;
