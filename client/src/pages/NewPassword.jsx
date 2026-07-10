import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import api from "../api/axios";

import logo from "../assets/logos/ichgram-logo.svg";
import resetPasswordIcon from "../assets/icons/reset-password-icon.svg";

import "../styles/newPassword.css";

const NewPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!token) {
      setError("Reset link is invalid or missing.");
      return;
    }

    if (!formData.password || !formData.confirmPassword) {
      setError("Please complete both password fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const { data } = await api.post(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        {
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }
      );

      setMessage(
        data.message ||
          "Password has been reset successfully. You can now log in."
      );

      setFormData({
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The link may be invalid or expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="new-password-page">
      <header className="new-password-header">
        <Link to="/login" aria-label="Go to login page">
          <img src={logo} alt="ICHGramm" />
        </Link>
      </header>

      <section className="new-password-card">
        <div className="new-password-content">
          <img
            className="new-password-icon"
            src={resetPasswordIcon}
            alt=""
            aria-hidden="true"
          />

          <h1>Create a new password</h1>

          <p>
            Enter a new password for your account. Use at least 6 characters.
          </p>

          <form className="new-password-form" onSubmit={handleSubmit}>
            <label>
              <span>New password</span>

              <input
                id="new-password"
                type="password"
                name="password"
                placeholder="New password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>

            <label>
              <span>Confirm password</span>

              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>

            <button type="submit" disabled={isLoading || !token}>
              {isLoading ? "Saving..." : "Reset password"}
            </button>
          </form>

          {!token && (
            <p className="new-password-error" role="alert">
              Reset link is invalid or missing.
            </p>
          )}

          {error && (
            <p
              className="new-password-error"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className="new-password-success"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </div>

        <Link to="/login" className="new-password-back-link">
          Back to login
        </Link>
      </section>
    </main>
  );
};

export default NewPassword;