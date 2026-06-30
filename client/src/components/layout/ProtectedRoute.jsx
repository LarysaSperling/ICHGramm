import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../ui/Loader";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;