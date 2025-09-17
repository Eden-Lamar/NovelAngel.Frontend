import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();

  if (!auth?.token) {
    // If no token, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children; // Otherwise, show the protected page
};

export default ProtectedRoute;
ProtectedRoute.propTypes = false;