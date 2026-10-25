
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_URL } from "../api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError(
        "The reset link is missing its token. Request a new password reset email."
      );
      return;
    }

    if (password.length < 12) {
      setError("Your new password must contain at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to reset your password.");
        return;
      }

      setMessage(result.message);
      setResetComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Reset password error:", err);
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
        <h1>Reset Password</h1>

        <p className="ktj-login-subtitle">
          Choose a new password for your account. It must contain at
          least 12 characters.
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

        {!resetComplete && (
          <form onSubmit={handleSubmit} className="ktj-login-form">
            <div className="ktj-login-field">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={12}
                required
              />
            </div>

            <div className="ktj-login-field">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={12}
                required
              />
            </div>

            <button
              type="submit"
              className="ktj-login-button"
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="ktj-login-register">
          <Link to="/login">Back to Login</Link>
        </p>
      </section>
    </main>
  );
}

export default ResetPassword;
