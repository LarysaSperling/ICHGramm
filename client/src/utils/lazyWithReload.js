import { lazy } from "react";

// Code splitting (REVIEW M-15): pages and the emoji picker are separate
// files (chunks) with a content hash in the name. A deploy on Vercel
// replaces them, so a tab opened before the deploy asks for a file that
// no longer exists. vercel.json rewrites every unknown path to
// index.html, so the browser gets HTML instead of JavaScript and the
// import fails. Reloading the page loads the new index.html, which points
// to the new files.
//
// The reload happens at most once per RELOAD_COOLDOWN_MS (like the server
// wake-up reload in serverStatus.js), and never while offline: then the
// error reaches ChunkErrorBoundary, which offers a manual reload.
//
// No "vite:preloadError" listener on purpose: Vite fires that event for
// every failed dynamic import (also the emoji picker, where a reload
// would wipe a half-typed comment), and without preventDefault() it
// simply rethrows - so the error arrives here (pages) or in
// LazyEmojiPicker's boundary anyway. A failed CSS file of a page rejects
// the import too.

const RELOAD_STORAGE_KEY = "chunkReloadAt";
const RELOAD_COOLDOWN_MS = 60000;

// true = a reload has started.
export const reloadForNewVersion = () => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }

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
  } catch {
    // Without sessionStorage a reload loop could not be stopped.
    return false;
  }

  window.location.reload();
  return true;
};

// While the page reloads, the promise never settles, so the Suspense
// fallback stays on screen instead of an error flashing up.
const loadOrReload = (importModule) =>
  importModule().catch((error) => {
    if (reloadForNewVersion()) {
      return new Promise(() => {});
    }

    throw error;
  });

// React.lazy for a page: on a failed import, reload once (see above).
const lazyWithReload = (importModule) =>
  lazy(() => loadOrReload(importModule));

export default lazyWithReload;
