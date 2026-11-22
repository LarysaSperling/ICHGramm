import { Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import ChunkErrorBoundary from "../components/ui/ChunkErrorBoundary";
import Loader from "../components/ui/Loader";
import lazyWithReload from "../utils/lazyWithReload";

// In the main bundle: the first page for guests (Login) and for logged-in
// users (Home with the feed). Everything else is loaded when it is opened
// (REVIEW M-15).
import Login from "../pages/Login";
import Home from "../pages/Home";

const Register = lazyWithReload(() => import("../pages/Register"));
const ResetPassword = lazyWithReload(() => import("../pages/ResetPassword"));
const NewPassword = lazyWithReload(() => import("../pages/NewPassword"));
const Search = lazyWithReload(() => import("../pages/Search"));
const CreatePost = lazyWithReload(() => import("../pages/CreatePost"));
const Messages = lazyWithReload(() => import("../pages/Messages"));
const Notifications = lazyWithReload(() => import("../pages/Notifications"));
const Profile = lazyWithReload(() => import("../pages/Profile"));
const EditProfile = lazyWithReload(() => import("../pages/EditProfile"));
const UserProfile = lazyWithReload(() => import("../pages/UserProfile"));
const NotFound = lazyWithReload(() => import("../pages/NotFound"));
const Explore = lazyWithReload(() => import("../pages/Explore"));

// Suspense / error boundaries:
//   - around the main routes: guest pages (Register, ...), full-page
//     Loader;
//   - inside AppLayout around <Outlet />: app pages, the sidebar stays;
//   - modal routes (backgroundLocation, <AppLayout modal />): no fallback
//     and an overlay error, so the page underneath stays visible while
//     the modal loads (location.state survives a reload, so both can
//     load at once).
// React Router wraps navigation in startTransition, so on a click the
// current page stays until the next one has loaded; a fallback is only
// seen when a page is opened directly or reloaded.
const AppRoutes = () => {
  const location = useLocation();

  const backgroundLocation =
    location.state?.backgroundLocation;

  return (
    <>
      <ChunkErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<Loader />}>
          <Routes
            location={
              backgroundLocation || location
            }
          >
            <Route
              path="/"
              element={
                <Navigate
                  to="/login"
                  replace
                />
              }
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/reset"
              element={<ResetPassword />}
            />

            <Route
              path="/new-password"
              element={<NewPassword />}
            />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/home"
                element={<Home />}
              />

              <Route
                path="/search"
                element={<Search />}
              />

              <Route
                path="/explore"
                element={<Explore />}
              />

              <Route
                path="/messages"
                element={<Messages />}
              />

              <Route
                path="/notifications"
                element={<Notifications />}
              />

              <Route
                path="/profile"
                element={<Profile />}
              />

              <Route
                path="/profile/edit"
                element={<EditProfile />}
              />

              <Route
                path="/users/:id"
                element={<UserProfile />}
              />

              <Route
                path="*"
                element={<NotFound />}
              />
            </Route>
          </Routes>
        </Suspense>
      </ChunkErrorBoundary>

      {backgroundLocation && (
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <AppLayout modal />
              </ProtectedRoute>
            }
          >
            <Route
              path="/create"
              element={<CreatePost />}
            />
          </Route>
        </Routes>
      )}
    </>
  );
};

export default AppRoutes;
