
import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();

  const userToken = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Logged-out users must log in first.
  if (!userToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Logged-in users can access only routes allowed for their role.
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
