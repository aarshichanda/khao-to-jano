
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to process your request.");
        return;
      }

      setMessage(
        result.message ||
          "If an account exists for this email, password reset instructions will be sent."
      );
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        "Could not connect to the server. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ktj-login-page">
      <section className="ktj-login-card">
        <p className="ktj-login-brand">KHAO TO JANO</p>
        <h1>Forgot Password?</h1>
        <p className="ktj-login-subtitle">
          Enter the email address associated with your account.
          We will help you reset your password.
        </p>

        {message && (
          <p className="ktj-forgot-success" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="ktj-login-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="ktj-login-form">
          <div className="ktj-login-field">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              required
            />
          </div>

          <button
            type="submit"
            className="ktj-login-button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Instructions"}
          </button>
        </form>

        <p className="ktj-login-register">
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>
      </section>
    </main>
  );
}

export default ForgotPassword;
