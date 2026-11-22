import { Component } from "react";

import "../../styles/lazyFallback.css";

// Catches a page (chunk) that could not be loaded - offline, or a stale
// tab after a deploy when the automatic reload was already used
// (utils/lazyWithReload.js) - and any other render error of the page, so
// the app does not turn into a white screen (REVIEW M-15).
//
// resetKey (the pathname) clears the error when the user navigates
// elsewhere. "overlay" is for modal routes that render over a page.
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Page failed to load:", error);
  }

  componentDidUpdate(previousProps) {
    if (
      this.state.hasError &&
      previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className={`chunk-error ${
          this.props.overlay ? "chunk-error--overlay" : ""
        }`}
        role="alert"
      >
        <p className="chunk-error-title">
          This page could not be loaded.
        </p>

        <p className="chunk-error-text">
          Check your connection, or reload to get the latest version.
        </p>

        <button
          type="button"
          className="chunk-error-button"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ChunkErrorBoundary;
