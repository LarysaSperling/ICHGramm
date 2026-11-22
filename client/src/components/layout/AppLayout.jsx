import { Suspense, useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ChunkErrorBoundary from "../ui/ChunkErrorBoundary";
import Loader from "../ui/Loader";

import "../../styles/layout.css";

// modal: the layout of a modal route (backgroundLocation, e.g. /create)
// that renders over a page. Its page has no loading fallback, so the page
// underneath stays visible, and an error is shown as an overlay
// (REVIEW M-15).
const AppLayout = ({ modal = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

       <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="app-main">
        <div className="page-content">
          {/* Pages are loaded when opened (REVIEW M-15). */}
          <ChunkErrorBoundary
            resetKey={location.pathname}
            overlay={modal}
          >
            <Suspense fallback={modal ? null : <Loader />}>
              <Outlet />
            </Suspense>
          </ChunkErrorBoundary>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;