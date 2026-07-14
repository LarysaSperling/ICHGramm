import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import socket from "../socket";

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