
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/ActivateOwner.css";
import { API_URL } from "../api";

function ActivateOwner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const token = searchParams.get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("The activation link is invalid or missing its token.");
      return;
    }

    if (password.length < 12) {
      setError("Your password must be at least 12 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/auth/activate-owner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to activate your account.");
      }

      setActivated(true);
      setMessage(
        data.message || "Your restaurant-owner account is activated."
      );
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="activate-owner-page">
      <section className="activate-owner-card">
        <h1>Activate Your Owner Account</h1>
        <p>
          Welcome to Khao To Jano. Set your password to activate your
          restaurant-owner account.
        </p>

        {error && <p role="alert" className="activation-error">{error}</p>}
        {message && (
          <p role="status" className="activation-success">{message}</p>
        )}

        {!activated && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="owner-password">New password</label>
            <input
              id="owner-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <label htmlFor="owner-confirm-password">
              Confirm password
            </label>
            <input
              id="owner-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Activating..." : "Activate Account"}
            </button>
          </form>
        )}

        {activated && (
          <button type="button" onClick={() => navigate("/login")}>
            Continue to Login
          </button>
        )}
      </section>
    </main>
  );
}

export default ActivateOwner;
