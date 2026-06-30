import { Navigate, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Search from "../pages/Search";
import Messages from "../pages/Messages";
import Notifications from "../pages/Notifications";
import CreatePost from "../pages/CreatePost";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/layout/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

const withLayout = (page) => (
  <ProtectedRoute>
    <AppLayout>{page}</AppLayout>
  </ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/home" element={withLayout(<Home />)} />
      <Route path="/profile/:id" element={withLayout(<Profile />)} />
      <Route path="/search" element={withLayout(<Search />)} />
      <Route path="/messages" element={withLayout(<Messages />)} />
      <Route path="/notifications" element={withLayout(<Notifications />)} />
      <Route path="/create" element={withLayout(<CreatePost />)} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;