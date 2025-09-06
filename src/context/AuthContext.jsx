import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [auth, setAuth] = useState(() => {
    const storedAuth = localStorage.getItem("auth");
    return storedAuth ? JSON.parse(storedAuth) : null;
  });

  console.log(auth);

  const [authError, setAuthError] = useState(null); // For alerting token expiration

  const navigate = useNavigate();

  const login = (userData) => {
    console.log("userData", userData);
    setAuth(userData);
    localStorage.setItem("auth", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
    setupAutoLogout(userData.token); // Schedule auto-logout
    navigate("/admin");
  };

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem("auth");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  }, [navigate]);

  const handleTokenInvalidation = useCallback((message) => {
    logout();
    setAuthError(message); // Set the alert message
    setTimeout(() => setAuthError(null), 5000); // Clear the alert after 5 seconds
  }, [logout]);


  // Function to decode token and schedule auto-logout
  const setupAutoLogout = useCallback((token) => {
    try {
      console.log(token)
      const { exp } = jwtDecode(token); // Decode the JWT to get expiration time
      const expirationTime = exp * 1000 - Date.now(); // Calculate time until expiration
      // console.log('Current Time:', new Date(Date.now()).toISOString());
      // console.log('Token Expiration:', new Date(exp * 1000).toISOString());
      // console.log('Expiration Time (ms):', expirationTime);

      if (expirationTime > 0) {
        const MAX_TIMEOUT_DELAY = 2147483647; // ~24.8 days in ms
        const safeDelay = Math.min(expirationTime, MAX_TIMEOUT_DELAY);
        console.log(`Scheduling logout in ${safeDelay / 1000} seconds (capped if necessary)`);
        setTimeout(() => {
          handleTokenInvalidation("Your session has expired. Please log in again.");
        }, safeDelay);
      } else {
        handleTokenInvalidation("Your session has expired. Please log in again.");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      handleTokenInvalidation("Invalid token. Please log in again.");
    }
  }, [handleTokenInvalidation]);

  // Set default Authorization header on app load if token exists
  useEffect(() => {
    console.log(auth)
    if (auth?.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
      setupAutoLogout(auth.token); // Schedule auto-logout
    }
  }, [auth, setupAutoLogout]);

  // Axios interceptor for handling JWT expiration or invalid token during API requests
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response, // Let successful responses pass through
      (error) => {
        if (error.response?.status === 401) {
          // 401 means unauthorized; log the user out
          handleTokenInvalidation("Your session has expired. Please log in again.");
        } else if (error.response?.status === 403) {
          // 403 means forbidden; token might be invalid
          handleTokenInvalidation("You are not authorized to perform this action.");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // Cleanup interceptor on unmount
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleTokenInvalidation]);

  return (
    <AuthContext.Provider value={{ auth, login, logout, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

AuthProvider.propTypes = false