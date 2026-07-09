import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ResetPassword from "../pages/ResetPassword";
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
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset" element={<ResetPassword />} />

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
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />

          <Route path="/users/:id" element={<UserProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/create" element={<CreatePost />} />
          </Route>
        </Routes>
      )}
    </>
  );
};

export default AppRoutes;
