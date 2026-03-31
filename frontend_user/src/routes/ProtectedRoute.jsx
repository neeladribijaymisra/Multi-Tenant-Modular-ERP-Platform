import { Navigate, useLocation, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  const { tenant, role } = useParams();

  if (!isAuthenticated) {
    return <Navigate to={`/${tenant || "cgu"}/login`} replace state={{ from: location }} />;
  }

  if (session.tenantSlug !== tenant || session.role !== role) {
    return <Navigate to={`/${session.tenantSlug}/${session.role}/dashboard`} replace />;
  }

  return children;
}
