import { Link, NavLink } from "react-router-dom";
import {
  House,
  Search,
  Compass,
  MessageCircle,
  Heart,
  SquarePlus,
  CircleUserRound,
  LogOut,
  Moon,
  Sun,
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
    <House size={24} strokeWidth={2} />
    <span>Home</span>
  </NavLink>

  <NavLink to="/search">
    <Search size={24} strokeWidth={2} />
    <span>Search</span>
  </NavLink>

  <NavLink to="/explore">
    <Compass size={24} strokeWidth={2} />
    <span>Explore</span>
  </NavLink>

  <NavLink to="/messages">
    <MessageCircle size={24} strokeWidth={2} />
    <span>Messages</span>
  </NavLink>

  <NavLink to="/notifications">
    <Heart size={24} strokeWidth={2} />
    <span>Notifications</span>
  </NavLink>

  <NavLink to="/create">
    <SquarePlus size={24} strokeWidth={2} />
    <span>Create</span>
  </NavLink>

  <NavLink to={`/profile/${user?._id}`}>
    <CircleUserRound size={24} strokeWidth={2} />
    <span>Profile</span>
  </NavLink>
</nav>

      <div className="sidebar-bottom">
  <button onClick={toggleTheme}>
    {theme === "light" ? (
      <>
        <Moon size={22} />
        <span>Dark mode</span>
      </>
    ) : (
      <>
        <Sun size={22} />
        <span>Light mode</span>
      </>
    )}
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