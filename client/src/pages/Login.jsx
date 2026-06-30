import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import logo from "../assets/logos/ichgram-logo.svg";
import loginPhone from "../assets/images/login-phone.png";

import "../styles/auth.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/login", formData);

      login(data);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-wrapper">
        <div className="auth-phone">
          <img src={loginPhone} alt="ICHGramm preview" />
        </div>

        <div className="auth-content">
          <form className="auth-card" onSubmit={handleSubmit}>
            <img className="auth-logo" src={logo} alt="ICHGramm" />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Log in"}
            </button>

            <div className="auth-divider">
              <span></span>
              <p>OR</p>
              <span></span>
            </div>

            <Link className="auth-forgot" to="/reset">
              Forgot password?
            </Link>
          </form>

          <div className="auth-switch">
            <p>
              Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;