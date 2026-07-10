import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";

import resetPasswordIcon from "../assets/icons/reset-password-icon.svg";
import logo from "../assets/logos/ichgram-logo.svg";

import "../styles/resetPassword.css";

const ResetPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim();

    setMessage("");
    setError("");

    if (!normalizedIdentifier) {
      setError("Please enter your email or username.");
      return;
    }

    try {
      setIsLoading(true);

      const { data } = await api.post("/auth/reset-password", {
        identifier: normalizedIdentifier,
      });

      setMessage(
        data.message ||
          "If an account with these details exists, a password reset link has been sent."
      );

      setIdentifier("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="reset-page">
      <header className="reset-header">
        <Link to="/login" aria-label="Go to login page">
          <img src={logo} alt="ICHGramm" />
        </Link>
      </header>

      <section className="reset-card">
        <div className="reset-content">
          <img
            className="reset-icon"
            src={resetPasswordIcon}
            alt=""
            aria-hidden="true"
          />

          <h1>Trouble logging in?</h1>

          <p>
            Enter your email, phone, or username and we'll send you a link to
            get back into your account.
          </p>

          <form className="reset-form" onSubmit={handleSubmit}>
            <input
              id="reset-identifier"
              type="text"
              name="identifier"
              placeholder="Email or Username"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={isLoading}
              aria-describedby={
                error
                  ? "reset-error"
                  : message
                    ? "reset-success"
                    : undefined
              }
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Reset your password"}
            </button>
          </form>

          {message && (
            <p
              id="reset-success"
              className="reset-success"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              id="reset-error"
              className="reset-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <div className="reset-divider">
            <span />
            <strong>OR</strong>
            <span />
          </div>

          <Link to="/register" className="reset-create-link">
            Create new account
          </Link>
        </div>

        <Link to="/login" className="reset-back-link">
          Back to login
        </Link>
      </section>
    </main>
  );
};

export default ResetPassword;
