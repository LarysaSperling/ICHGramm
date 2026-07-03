import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Search from "../pages/Search";
import CreatePost from "../pages/CreatePost";
import Messages from "../pages/Messages";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";
import UserProfile from "../pages/UserProfile";
import NotFound from "../pages/NotFound";
import Explore from "../pages/Explore";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />

        <Route path="/users/:id" element={<UserProfile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;