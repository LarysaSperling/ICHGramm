import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

import "../../styles/layout.css";

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <Outlet />
      </main>

      <RightSidebar />
    </div>
  );
};

export default AppLayout;