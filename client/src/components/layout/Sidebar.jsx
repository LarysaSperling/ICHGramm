import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  Home,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  User,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import logo from "../../assets/logos/ichgram-logo.svg";

import "../../styles/layout.css";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <Link to="/home" className="sidebar-logo">
        <img src={logo} alt="ICHGramm" />
      </Link>

      <nav className="sidebar-nav">
        <NavLink to="/home">
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search">
          <Search size={24} />
          <span>Search</span>
        </NavLink>

        <NavLink to="/create">
          <PlusSquare size={24} />
          <span>Create</span>
        </NavLink>

        <NavLink to="/messages">
          <MessageCircle size={24} />
          <span>Messages</span>
        </NavLink>

        <NavLink to="/notifications">
          <Bell size={24} />
          <span>Notifications</span>
        </NavLink>

        <NavLink to={`/profile/${user?._id || user?.id}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button onClick={toggleTheme}>
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>

        <button onClick={logout}>
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;