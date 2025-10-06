import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth?.token) {
    // Allow login and register pages without redirect
    if (location.pathname === "/login" || location.pathname === "/register") {
      return children;
    }

    // Otherwise force redirect to login
    return <Navigate to="/login" replace />;
  }

  return children; // Otherwise, show the protected page
};

export default ProtectedRoute;
ProtectedRoute.propTypes = false;