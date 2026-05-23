import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import LoadingScreen from "../pages/LoadingScreen";
import LoginPage from "../pages/LoginPage";
import { roleHome } from "./routeUtils";

function canAccessRole(accountRole, allowedRole) {
  if (accountRole === allowedRole) return true;
  return accountRole === "admin" && allowedRole === "teacher";
}

export default function EntryGate({ allowedRole, children }) {
  const { account, status } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return <LoadingScreen label="Checking account access" />;
  }

  if (status !== "assigned" || !account) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }

    return <LoginPage />;
  }

  const home = roleHome(account.role);

  if (allowedRole) {
    if (canAccessRole(account.role, allowedRole)) {
      return children;
    }

    return <Navigate to={home} replace />;
  }

  return <Navigate to={home} replace />;
}
