import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, X } from "lucide-react";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";
import Loader from "../components/ui/Loader";
import Home from "./Home";

import "../styles/notifications.css";

const Notifications = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("notifications-open");

    return () => {
      document.body.classList.remove("notifications-open");
    };
  }, []);

  useEffect(() => {
    const getNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");

        setNotifications(data);

        if (data.some((notification) => !notification.isRead)) {
          await api.put("/notifications/read-all");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };

    getNotifications();
  }, []);

  const getText = (type) => {
    if (type === "like") return "liked your post.";
    if (type === "comment") return "commented on your post.";
    if (type === "follow") return "started following you.";
    return "sent you a notification.";
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete("/notifications/clear");
      setNotifications([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear notifications");
    }
  };

  return (
    <>
      <div className="notifications-home-bg">
        <Home />
      </div>

      <div
        className="notifications-dark-layer"
        onClick={() => navigate("/home")}
      />

      <div className="notifications-overlay">
        <section className="notifications-panel">
          <div className="notifications-header">
            <h1>Notifications</h1>

            <button type="button" onClick={() => navigate("/home")}>
              <X size={22} />
            </button>
          </div>

          <div className="notifications-subheader">
            <h2 className="notifications-section-title">New</h2>

            {notifications.length > 0 && (
              <button
                type="button"
                className="notifications-clear"
                onClick={handleClearAll}
              >
                Clear all
              </button>
            )}
          </div>

          {isLoading && <Loader />}

          {error && <p className="notifications-error">{error}</p>}

          {!isLoading && !error && notifications.length === 0 && (
            <p className="notifications-empty">No notifications yet.</p>
          )}

          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${
                  notification.isRead ? "read" : "unread"
                }`}
              >
                {!notification.isRead && (
                  <span className="notification-unread-dot" />
                )}

                <Avatar
                  src={notification.sender?.avatar}
                  name={
                    notification.sender?.username ||
                    notification.sender?.fullName
                  }
                  size={44}
                />

                <div className="notification-content">
                  <p>
                    <strong>{notification.sender?.username || "unknown"}</strong>{" "}
                    {getText(notification.type)}
                  </p>
                </div>

                {notification.post?.image && (
                  <img
                    src={notification.post.image}
                    alt="Post"
                    className="notification-post-image"
                  />
                )}

                <button
                  type="button"
                  className="notification-delete"
                  onClick={() => handleDeleteNotification(notification._id)}
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default Notifications;