// Detects a Render free-tier cold start (REVIEW M-10).
//
// After ~15 min without traffic Render puts the server to sleep, and the
// first request then waits 30-60 s while it boots. On app start we ping
// /api/health in the background; nothing waits for it. Only if the
// answer takes longer than SLOW_THRESHOLD_MS do we report "waking", so a
// server that is already up never shows a banner.
//
// Lives outside React (like setUnauthorizedHandler in axios.js); React
// reads it through useServerStatus().
//
// Statuses:
//   checking - first ping in flight, not slow yet (nothing shown)
//   waking   - no answer after 3 s, still trying
//   down     - no answer within MAX_WAIT_MS
//   woke     - answered after we showed "waking"; shown briefly
//   ready    - server answers (nothing shown)
//
// A normal wake-up (waking -> ready) reloads nothing: requests sent
// meanwhile just wait for the server. But if we reached "down", or an
// API request hit the axios timeout before the server woke up, parts of
// the page have already given up (empty feed, stuck "Loading..."). Then
// the page is reloaded once when the server answers. A reload is skipped
// if the previous auto-reload was less than RELOAD_COOLDOWN_MS ago, so a
// server that keeps falling asleep cannot cause a reload loop.

import { apiUrl } from "./config";

const HEALTH_URL = `${apiUrl}/health`;

const SLOW_THRESHOLD_MS = 3000;
const ATTEMPT_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 2000;
const MAX_WAIT_MS = 90000;
const WOKE_VISIBLE_MS = 1500;
const RELOAD_COOLDOWN_MS = 120000;
const RELOAD_STORAGE_KEY = "serverWakeReloadAt";

// What Render's proxy may answer while the app is still booting.
// Any other HTTP answer means our server itself responded.
const RETRY_STATUSES = new Set([502, 503, 504]);

let status = "checking";
let checkId = 0;
let needsReload = false;
const listeners = new Set();

const setStatus = (nextStatus) => {
  if (status === nextStatus) {
    return;
  }

  if (nextStatus === "down") {
    needsReload = true;
  }

  status = nextStatus;
  listeners.forEach((listener) => listener());
};

export const getServerStatus = () => status;

// Called by the axios interceptor on a timeout. A timeout while the
// server is up (a slow request) does not matter here.
export const markRequestTimedOut = () => {
  if (status !== "ready") {
    needsReload = true;
  }
};

// true at most once per RELOAD_COOLDOWN_MS. Without sessionStorage
// (blocked storage) we never reload: no reload beats a possible loop.
const claimAutoReload = () => {
  try {
    const lastReloadAt = Number(
      sessionStorage.getItem(RELOAD_STORAGE_KEY),
    );

    if (
      lastReloadAt &&
      Date.now() - lastReloadAt < RELOAD_COOLDOWN_MS
    ) {
      return false;
    }

    sessionStorage.setItem(
      RELOAD_STORAGE_KEY,
      String(Date.now()),
    );

    return true;
  } catch {
    return false;
  }
};

export const subscribeServerStatus = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// true = the server answered, false = try again.
const pingOnce = async (timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const response = await fetch(HEALTH_URL, {
      cache: "no-store",
      signal: controller.signal,
    });

    return !RETRY_STATUSES.has(response.status);
  } catch {
    // Timeout (abort) or network error.
    return false;
  } finally {
    clearTimeout(timer);
  }
};

// Called once at startup (main.jsx) and by the banner's Retry button,
// which passes { immediate: true } so the banner does not disappear for
// 3 s while the new check starts.
export const checkServer = async ({ immediate = false } = {}) => {
  const id = ++checkId;
  const isCurrent = () => id === checkId;
  const deadline = Date.now() + MAX_WAIT_MS;

  setStatus(immediate ? "waking" : "checking");

  const slowTimer = setTimeout(() => {
    if (isCurrent() && status === "checking") {
      setStatus("waking");
    }
  }, SLOW_THRESHOLD_MS);

  try {
    for (;;) {
      const isUp = await pingOnce(
        Math.min(
          ATTEMPT_TIMEOUT_MS,
          deadline - Date.now(),
        ),
      );

      if (!isCurrent()) {
        return;
      }

      if (isUp) {
        if (status === "waking") {
          setStatus("woke");
          await wait(WOKE_VISIBLE_MS);

          if (!isCurrent()) {
            return;
          }
        }

        if (needsReload) {
          needsReload = false;

          if (claimAutoReload()) {
            window.location.reload();
            return;
          }
        }

        setStatus("ready");
        return;
      }

      if (Date.now() + RETRY_DELAY_MS >= deadline) {
        setStatus("down");
        return;
      }

      await wait(RETRY_DELAY_MS);

      if (!isCurrent()) {
        return;
      }
    }
  } finally {
    clearTimeout(slowTimer);
  }
};
