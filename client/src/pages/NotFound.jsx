import loginPhone from "../assets/images/login-phone.png";

import "../styles/notFound.css";

const NotFound = () => {
  return (
    <section className="not-found-page">
      <div className="not-found-content">
        <img
          className="not-found-image"
          src={loginPhone}
          alt="Instagram phone preview"
        />

        <div className="not-found-text">
          <h1>Oops! Page Not Found (404 Error)</h1>

          <p>
            We're sorry, but the page you're looking for doesn't seem to exist.
            If you typed the URL manually, please double-check the spelling.
          </p>

          <p>
            If you clicked on a link, it may be outdated or broken.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NotFound;