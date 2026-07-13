import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import api from "../api/axios";
import socket from "../socket";
import { useAuth } from "./AuthContext";

export const MessagesContext = createContext(null);

export const MessagesProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const toastTimeoutRef = useRef(null);

  const [unreadMessages, setUnreadMessages] =
    useState(0);
  const [messageToast, setMessageToast] =
    useState(null);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  const loadUnreadNotifications =
    useCallback(async () => {
      if (!user?._id) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const { data } = await api.get(
          "/notifications",
        );

        const notifications = Array.isArray(data)
          ? data
          : [];

        const unreadCount = notifications.filter(
          (notification) =>
            !notification.isRead,
        ).length;

        setUnreadNotifications(unreadCount);
      } catch (error) {
        console.error(
          error.response?.data?.message ||
            "Failed to load unread notifications",
        );
      }
    }, [user?._id]);

  useEffect(() => {
    loadUnreadNotifications();
  }, [loadUnreadNotifications]);

  useEffect(() => {
    if (!user?._id) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      setMessageToast(null);

      return;
    }

    socket.auth = {
      userId: user._id,
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinUserRoom", user._id);

    const handleNewMessageNotification = (
      message,
    ) => {
      if (
        location.pathname === "/messages"
      ) {
        return;
      }

      setUnreadMessages(
        (previousCount) =>
          previousCount + 1,
      );

      setMessageToast({
        sender:
          message.sender?.username ||
          "New message",
        text:
          message.messageType === "post"
            ? "Shared a post"
            : message.text || "",
      });

      if (toastTimeoutRef.current) {
        clearTimeout(
          toastTimeoutRef.current,
        );
      }

      toastTimeoutRef.current = setTimeout(
        () => {
          setMessageToast(null);
        },
        3500,
      );
    };

    const handleNewNotification = () => {
      if (
        location.pathname ===
        "/notifications"
      ) {
        return;
      }

      setUnreadNotifications(
        (previousCount) =>
          previousCount + 1,
      );
    };

    socket.on(
      "newMessageNotification",
      handleNewMessageNotification,
    );

    socket.on(
      "newNotification",
      handleNewNotification,
    );

    return () => {
      socket.off(
        "newMessageNotification",
        handleNewMessageNotification,
      );

      socket.off(
        "newNotification",
        handleNewNotification,
      );

      if (toastTimeoutRef.current) {
        clearTimeout(
          toastTimeoutRef.current,
        );

        toastTimeoutRef.current = null;
      }
    };
  }, [user?._id, location.pathname]);

  const clearUnreadMessages =
    useCallback(() => {
      setUnreadMessages(0);
      setMessageToast(null);

      if (toastTimeoutRef.current) {
        clearTimeout(
          toastTimeoutRef.current,
        );

        toastTimeoutRef.current = null;
      }
    }, []);

  const clearUnreadNotifications =
    useCallback(() => {
      setUnreadNotifications(0);
    }, []);

  const refreshUnreadNotifications =
    useCallback(async () => {
      await loadUnreadNotifications();
    }, [loadUnreadNotifications]);

  const value = useMemo(
    () => ({
      unreadMessages,
      messageToast,
      clearUnreadMessages,

      unreadNotifications,
      clearUnreadNotifications,
      refreshUnreadNotifications,
    }),
    [
      unreadMessages,
      messageToast,
      clearUnreadMessages,
      unreadNotifications,
      clearUnreadNotifications,
      refreshUnreadNotifications,
    ],
  );

  return (
    <MessagesContext.Provider
      value={value}
    >
      {children}
    </MessagesContext.Provider>
  );
};