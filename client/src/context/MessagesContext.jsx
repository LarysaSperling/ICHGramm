import { createContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import socket from "../socket";
import { useAuth } from "./AuthContext";

export const MessagesContext = createContext(null);

export const MessagesProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  const toastTimeoutRef = useRef(null);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [messageToast, setMessageToast] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    socket.auth = { userId: user._id };

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinUserRoom", user._id);

    const handleNewMessageNotification = (message) => {
      if (location.pathname === "/messages") return;

      setUnreadMessages((prev) => prev + 1);

      setMessageToast({
        sender: message.sender?.username || "New message",
        text: message.text || "",
      });

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        setMessageToast(null);
      }, 3500);
    };

    socket.on("newMessageNotification", handleNewMessageNotification);

    return () => {
      socket.off("newMessageNotification", handleNewMessageNotification);

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user?._id, location.pathname]);

  const clearUnreadMessages = () => {
    setUnreadMessages(0);
    setMessageToast(null);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };

  const value = {
    unreadMessages,
    messageToast,
    clearUnreadMessages,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};