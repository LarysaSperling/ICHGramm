import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthLoading] = useState(false);

  const login = (data) => {
    localStorage.setItem("token", data.token);

    const userData = {
      _id: data._id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthLoading,
      isAuthenticated: Boolean(localStorage.getItem("token") && user),
    }),
    [user, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);