
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_BASE_URL from "../api";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
     const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setError(
          result.message || "Invalid login details. Please try again."
        );
        return;
      }

      const user = result.user;
      const roles = Array.isArray(user.roles)
        ? [...new Set([...user.roles, user.role].filter(Boolean))]
        : [user.role].filter(Boolean);

      localStorage.setItem("token", result.token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userRoles", JSON.stringify(roles));
      localStorage.setItem("userName", user.name || user.username || "");
      localStorage.setItem("userEmail", user.email || "");

      if (roles.includes("admin")) {
        navigate("/admin/dashboard");
      } else if (
        roles.includes("customer") &&
        roles.includes("restaurant_owner")
      ) {
        const choice = window.confirm(
          "Login successful. Choose OK for the restaurant-owner dashboard, or Cancel for the customer dashboard."
        );

        navigate(
          choice ? "/owner/dashboard" : "/customer/dashboard"
        );
      } else if (roles.includes("restaurant_owner")) {
        navigate("/owner/dashboard");
      } else {
        navigate("/customer/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Could not connect to the server. Please ensure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ktj-login-page">
      <section className="ktj-login-card">
        <p className="ktj-login-brand">KHAO TO JANO</p>
        <h1>Welcome Back</h1>
        <p className="ktj-login-subtitle">
          Sign in to continue to your account.
        </p>

        {error && (
          <p className="ktj-login-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleLoginSubmit} className="ktj-login-form">
          <div className="ktj-login-field">
            <label htmlFor="login-identifier">
              Email Address, Username, or Phone Number
            </label>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email, username, or phone"
              required
            />
          </div>

          <div className="ktj-login-field">
            <div className="ktj-password-label-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password" className="ktj-forgot-link">
                Forgot Password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="ktj-login-button"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login to Khao to Jano"}
          </button>
        </form>

        <p className="ktj-login-register">
          New to Khao To Jano?{" "}
          <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="ktj-login-home">
          Back to Home
        </Link>
      </section>
    </main>
  );
}

export default Login;
