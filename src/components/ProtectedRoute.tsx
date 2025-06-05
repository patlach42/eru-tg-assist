import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isLoggedIn = localStorage.getItem("is_login") === "true";

  if (!isLoggedIn) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is logged in, render the requested component
  return children;
};

export default ProtectedRoute;
