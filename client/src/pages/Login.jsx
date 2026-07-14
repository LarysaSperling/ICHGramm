import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import logo from "../assets/logos/ichgram-logo.svg";
import loginPhone from "../assets/images/login-phone.png";

import "../styles/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedIdentifier =
      formData.identifier.trim();

    if (
      !normalizedIdentifier ||
      !formData.password
    ) {
      setError(
        "Please enter your username or email and password.",
      );

      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const { data } = await api.post(
        "/auth/login",
        {
          identifier: normalizedIdentifier,
          password: formData.password,
        },
      );

      login(data);

      navigate("/home", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <section className="auth-wrapper">
        <div
          className="auth-phone"
          aria-hidden="true"
        >
          <img
            src={loginPhone}
            alt=""
          />
        </div>

        <div className="auth-content">
          <form
            className="auth-card"
            onSubmit={handleSubmit}
          >
            <img
              className="auth-logo"
              src={logo}
              alt="ICHGramm"
            />

            <input
              id="login-identifier"
              type="text"
              name="identifier"
              placeholder="Username, or email"
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              disabled={isLoading}
              aria-describedby={
                error
                  ? "login-error"
                  : undefined
              }
            />

            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={isLoading}
              aria-describedby={
                error
                  ? "login-error"
                  : undefined
              }
            />

            {error && (
              <p
                id="login-error"
                className="auth-error"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? "Logging in..."
                : "Log in"}
            </button>

            <div className="auth-divider">
              <span />

              <p>OR</p>

              <span />
            </div>

            <Link
              className="auth-forgot"
              to="/reset"
            >
              Forgot password?
            </Link>
          </form>

          <div className="auth-switch">
            <p>
              Don&apos;t have an account?{" "}
              <Link to="/register">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;