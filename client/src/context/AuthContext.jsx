import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

import socket from "../socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthLoading] = useState(false);

  const login = (data) => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.setItem("token", data.token);

    const userData = {
      _id: data._id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      avatar: data.avatar || "",
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    socket.auth = { userId: userData._id };
    socket.connect();
  };

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const updatedUser = {
        ...prev,
        ...newData,
        avatar: newData.avatar || prev?.avatar || "",
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    });
  }, []);

  const logout = () => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      updateUser,
      isAuthLoading,
      isAuthenticated: Boolean(localStorage.getItem("token") && user),
    }),
    [user, updateUser, isAuthLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);