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
import { useMessages } from "../../hooks/useMessages";

import logo from "../../assets/logos/ichgram-logo.svg";

import "../../styles/layout.css";

const Sidebar = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const {
    unreadMessages,
    messageToast,
    clearUnreadMessages,
  } = useMessages();

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

        <NavLink
          to="/messages"
          className="sidebar-link-with-badge"
          onClick={clearUnreadMessages}
        >
          <div className="sidebar-icon-wrap">
            <MessageCircle size={24} strokeWidth={2} />

            {unreadMessages > 0 && (
              <span className="sidebar-badge">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </div>

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

        <NavLink to="/profile">
          <CircleUserRound size={24} strokeWidth={2} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <button type="button" onClick={toggleTheme}>
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

        <button type="button" onClick={logout}>
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </div>

      {messageToast && (
        <Link
          to="/messages"
          className="message-toast"
          onClick={clearUnreadMessages}
        >
          <strong>{messageToast.sender}</strong>
          <span>{messageToast.text}</span>
        </Link>
      )}
    </aside>
  );
};

export default Sidebar;