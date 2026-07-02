import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

import "../../styles/layout.css";

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">
        <Outlet />
      </main>

      <RightSidebar />
    </div>
  );
};

export default AppLayout;