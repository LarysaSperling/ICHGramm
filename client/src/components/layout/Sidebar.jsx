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

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { unreadMessages, messageToast, clearUnreadMessages } = useMessages();

  const handleNavigate = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <Link to="/home" className="sidebar-logo" onClick={handleNavigate}>
        <img src={logo} alt="ICHGramm" />
      </Link>

      <nav className="sidebar-nav">
        <NavLink to="/home" onClick={handleNavigate}>
          <House size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/search" onClick={handleNavigate}>
          <Search size={24} />
          <span>Search</span>
        </NavLink>

        <NavLink to="/explore" onClick={handleNavigate}>
          <Compass size={24} />
          <span>Explore</span>
        </NavLink>

        <NavLink
          to="/messages"
          className="sidebar-link-with-badge"
          onClick={() => {
            clearUnreadMessages();
            handleNavigate();
          }}
        >
          <div className="sidebar-icon-wrap">
            <MessageCircle size={24} />

            {unreadMessages > 0 && (
              <span className="sidebar-badge">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </div>

          <span>Messages</span>
        </NavLink>

        <NavLink to="/notifications" onClick={handleNavigate}>
          <Heart size={24} />
          <span>Notifications</span>
        </NavLink>

        <NavLink to="/create" onClick={handleNavigate}>
          <SquarePlus size={24} />
          <span>Create</span>
        </NavLink>

        <NavLink to="/profile" onClick={handleNavigate}>
          <CircleUserRound size={24} />
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
          onClick={() => {
            clearUnreadMessages();
            handleNavigate();
          }}
        >
          <strong>{messageToast.sender}</strong>
          <span>{messageToast.text}</span>
        </Link>
      )}
    </aside>
  );
};

export default Sidebar;