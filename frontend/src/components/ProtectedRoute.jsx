import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, isAuthenticated, tokenValidationLoading } = useSelector((state) => state.auth);
    const location = useLocation();

    // 1. Check if a token physically exists on the device
    const hasLocalToken = !!localStorage.getItem("access_token");

    // 2. OPTIMISTIC RENDERING (The Magic Fix)
    // If we have a local token and are currently validating it (or waiting for the user object),
    // DO NOT show a full-screen loader. Let the children render so the Feed skeletons show up instantly!
    if (hasLocalToken && (tokenValidationLoading || !user)) {
        return children;
    }

    // 3. If there is no token and they aren't authenticated, kick to login
    if (!isAuthenticated && !hasLocalToken) {
        return <Navigate to="/login" replace />;
    }

    // 4. Admin authorization (Make sure to check if user exists first since we optimistic rendered)
    if (requireAdmin && user && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // 5. Passed all checks. Return content. 
    return children;
};