import { Link } from "react-router-dom";

import resetPasswordIcon from "../assets/icons/reset-password-icon.svg";
import logo from "../assets/logos/ichgram-logo.svg";
import "../styles/resetPassword.css";

const ResetPassword = () => {
  return (
    <main className="reset-page">
      <header className="reset-header">
        <Link to="/login">
          <img src={logo} alt="ICHGram" />
        </Link>
      </header>
      <section className="reset-card">
        <div className="reset-content">
          <img
            className="reset-icon"
            src={resetPasswordIcon}
            alt="Trouble logging in"
          />

          <h1>Trouble logging in?</h1>

          <p>
            Enter your email, phone, or username and we'll send you a link to
            get back into your account.
          </p>

          <form className="reset-form">
            <input
              type="text"
              name="emailOrUsername"
              placeholder="Email or Username"
              autoComplete="username"
            />

            <button type="submit">Reset your password</button>
          </form>

          <div className="reset-divider">
            <span></span>
            <strong>OR</strong>
            <span></span>
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
