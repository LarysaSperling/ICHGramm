import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();

  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadMessages, messageToast, clearUnreadMessages } = useMessages();

  const closeMobileSidebar = () => {
    if (onClose) onClose();
  };

  const handleToggleNavigate = (path) => {
    if (location.pathname === path) {
      navigate("/home");
    } else {
      navigate(path);
    }

    closeMobileSidebar();
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <Link to="/home" className="sidebar-logo" onClick={closeMobileSidebar}>
        <img src={logo} alt="ICHGramm" />
      </Link>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={location.pathname === "/home" ? "active" : ""}
          onClick={() => handleToggleNavigate("/home")}
        >
          <House size={20} />
          <span>Home</span>
        </button>

        <button
          type="button"
          className={location.pathname === "/search" ? "active" : ""}
          onClick={() => handleToggleNavigate("/search")}
        >
          <Search size={20} />
          <span>Search</span>
        </button>

        <button
          type="button"
          className={location.pathname === "/explore" ? "active" : ""}
          onClick={() => handleToggleNavigate("/explore")}
        >
          <Compass size={20} />
          <span>Explore</span>
        </button>

        <button
          type="button"
          className={`sidebar-link-with-badge ${
            location.pathname === "/messages" ? "active" : ""
          }`}
          onClick={() => {
            clearUnreadMessages();
            handleToggleNavigate("/messages");
          }}
        >
          <div className="sidebar-icon-wrap">
            <MessageCircle size={20} />

            {unreadMessages > 0 && (
              <span className="sidebar-badge">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </div>

          <span>Messages</span>
        </button>

        <button
          type="button"
          className={location.pathname === "/notifications" ? "active" : ""}
          onClick={() => handleToggleNavigate("/notifications")}
        >
          <Heart size={20} />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          className={location.pathname === "/create" ? "active" : ""}
          onClick={() => {
            navigate("/create", {
              state: { backgroundLocation: location },
            });

            closeMobileSidebar();
          }}
        >
          <SquarePlus size={20} />
          <span>Create</span>
        </button>

        <button
          type="button"
          className={location.pathname === "/profile" ? "active" : ""}
          onClick={() => handleToggleNavigate("/profile")}
        >
          <CircleUserRound size={20} />
          <span>Profile</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <button type="button" onClick={toggleTheme}>
          {theme === "light" ? (
            <>
              <Moon size={20} />
              <span>Dark mode</span>
            </>
          ) : (
            <>
              <Sun size={20} />
              <span>Light mode</span>
            </>
          )}
        </button>

        <button type="button" onClick={logout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {messageToast && (
        <Link
          to="/messages"
          className="message-toast"
          onClick={() => {
            clearUnreadMessages();
            closeMobileSidebar();
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