import { useEffect, useState } from "react";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";
import Loader from "../components/ui/Loader";

import "../styles/notifications.css";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getNotifications = async () => {
      try {
        const { data } = await api.get("/notifications");
        setNotifications(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load notifications"
        );
      } finally {
        setIsLoading(false);
      }
    };

    getNotifications();
  }, []);

  const handleRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error(
        err.response?.data?.message || "Failed to mark notification as read"
      );
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <main className="notifications-page">
      <h1>Notifications</h1>

      {error && <p className="notifications-error">{error}</p>}

      {!error && notifications.length === 0 && (
        <p className="notifications-empty">
          No notifications yet.
        </p>
      )}

      <div className="notifications-list">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`notification-card ${
              notification.isRead ? "read" : "unread"
            }`}
            onClick={() => handleRead(notification._id)}
          >
            <Avatar
              src={notification.sender?.avatar}
              name={
                notification.sender?.username ||
                notification.sender?.fullName
              }
              size={44}
            />

            <div className="notification-content">
              <strong>
                {notification.sender?.username}
              </strong>{" "}
              {notification.type === "like" &&
                "liked your post."}

              {notification.type === "comment" &&
                "commented on your post."}

              {notification.type === "follow" &&
                "started following you."}
            </div>

            {notification.post?.image && (
              <img
                src={notification.post.image}
                alt="Post"
                className="notification-post-image"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  );
};

export default Notifications;