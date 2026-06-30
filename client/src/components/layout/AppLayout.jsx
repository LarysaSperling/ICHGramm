import Sidebar from "./Sidebar";

import "../../styles/layout.css";

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main">{children}</main>
    </div>
  );
};

export default AppLayout;