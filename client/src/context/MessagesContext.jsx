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

export const MessagesContext =
  createContext(null);

export const MessagesProvider = ({
  children,
}) => {
  const { user } = useAuth();
  const location = useLocation();

  const toastTimeoutRef = useRef(null);
  const pathnameRef = useRef(
    location.pathname,
  );

  const [unreadMessages, setUnreadMessages] =
    useState(0);

  const [messageToast, setMessageToast] =
    useState(null);

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  useEffect(() => {
    pathnameRef.current =
      location.pathname;
  }, [location.pathname]);

  const clearToastTimeout =
    useCallback(() => {
      if (!toastTimeoutRef.current) {
        return;
      }

      clearTimeout(
        toastTimeoutRef.current,
      );

      toastTimeoutRef.current = null;
    }, []);

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

        const notifications =
          Array.isArray(data) ? data : [];

        const unreadCount =
          notifications.filter(
            (notification) =>
              !notification.isRead,
          ).length;

        setUnreadNotifications(
          unreadCount,
        );
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
    const userId = user?._id;

    if (!userId) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      setMessageToast(null);

      clearToastTimeout();

      if (socket.connected) {
        socket.disconnect();
      }

      socket.auth = {};

      return undefined;
    }

    const joinUserRoom = () => {
      socket.emit(
        "joinUserRoom",
        userId,
      );
    };

    const handleConnect = () => {
      joinUserRoom();
    };

    const handleConnectError = (
      error,
    ) => {
      console.error(
        "Socket connection failed:",
        error.message,
      );
    };

    const handleNewMessageNotification = (
      message,
    ) => {
      if (
        pathnameRef.current ===
        "/messages"
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

      clearToastTimeout();

      toastTimeoutRef.current =
        setTimeout(() => {
          setMessageToast(null);
          toastTimeoutRef.current = null;
        }, 3500);
    };

    const handleNewNotification = () => {
      if (
        pathnameRef.current ===
        "/notifications"
      ) {
        return;
      }

      setUnreadNotifications(
        (previousCount) =>
          previousCount + 1,
      );
    };

    socket.auth = {
      userId,
    };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "connect_error",
      handleConnectError,
    );

    socket.on(
      "newMessageNotification",
      handleNewMessageNotification,
    );

    socket.on(
      "newNotification",
      handleNewNotification,
    );

    if (socket.connected) {
      joinUserRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "connect_error",
        handleConnectError,
      );

      socket.off(
        "newMessageNotification",
        handleNewMessageNotification,
      );

      socket.off(
        "newNotification",
        handleNewNotification,
      );

      clearToastTimeout();
    };
  }, [user?._id, clearToastTimeout]);

  const clearUnreadMessages =
    useCallback(() => {
      setUnreadMessages(0);
      setMessageToast(null);

      clearToastTimeout();
    }, [clearToastTimeout]);

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