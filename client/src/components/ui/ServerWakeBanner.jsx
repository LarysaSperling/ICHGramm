import { checkServer } from "../../api/serverStatus";
import useServerStatus from "../../hooks/useServerStatus";

import "../../styles/serverWakeBanner.css";

// Shown on every page while the Render server wakes up (REVIEW M-10).
const ServerWakeBanner = () => {
  const status = useServerStatus();

  if (
    status !== "waking" &&
    status !== "down" &&
    status !== "woke"
  ) {
    return null;
  }

  return (
    <div
      className={`server-wake-banner server-wake-banner--${status}`}
      role="status"
      aria-live="polite"
    >
      {status === "waking" && (
        <>
          <span
            className="server-wake-spinner"
            aria-hidden="true"
          />

          <span>
            Waking up the server… this can take up
            to a minute on the free plan.
          </span>
        </>
      )}

      {status === "down" && (
        <>
          <span>
            The server is not responding. Please
            try again in a moment.
          </span>

          <button
            type="button"
            className="server-wake-retry"
            onClick={() =>
              checkServer({ immediate: true })
            }
          >
            Retry
          </button>
        </>
      )}

      {status === "woke" && (
        <span>Server is ready ✓</span>
      )}
    </div>
  );
};

export default ServerWakeBanner;
