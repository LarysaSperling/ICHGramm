import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { setUnauthorizedHandler } from "../api/axios";
import socket from "../socket";

// Messages the server uses when the socket JWT is missing,
// invalid or expired (src/socket/socket.js).
const SOCKET_AUTH_ERRORS = [
  "Not authorized",
  "Session expired",
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [isAuthLoading] = useState(false);

  const login = useCallback((data) => {
    localStorage.setItem(
      "token",
      data.token,
    );

    const userData = {
      _id: data._id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      avatar: data.avatar || "",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(userData),
    );

    setUser(userData);
  }, []);

  const updateUser = useCallback(
    (newData) => {
      setUser((previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          ...newData,
          avatar:
            newData.avatar ??
            previousUser.avatar ??
            "",
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser),
        );

        return updatedUser;
      });
    },
    [],
  );

  const logout = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }

    socket.auth = {};

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  }, []);

  const navigate = useNavigate();

  // Expired or invalid token: from any API request (401) or from
  // Socket.io (rejected handshake or "sessionExpired" event).
  useEffect(() => {
    const endSession = () => {
      if (!localStorage.getItem("token")) {
        return;
      }

      logout();
      navigate("/login", { replace: true });
    };

    const handleConnectError = (error) => {
      if (SOCKET_AUTH_ERRORS.includes(error?.message)) {
        endSession();
      }
    };

    setUnauthorizedHandler(endSession);
    socket.on("connect_error", handleConnectError);
    socket.on("sessionExpired", endSession);

    return () => {
      setUnauthorizedHandler(null);
      socket.off("connect_error", handleConnectError);
      socket.off("sessionExpired", endSession);
    };
  }, [logout, navigate]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
      isAuthLoading,
      isAuthenticated: Boolean(
        localStorage.getItem("token") &&
          user,
      ),
    }),
    [
      user,
      login,
      logout,
      updateUser,
      isAuthLoading,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);