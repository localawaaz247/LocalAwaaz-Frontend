import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export function PublicRoute({ children }) {
    const { isAuthenticated, tokenValidationLoading } = useSelector((state) => state.auth);

    // 1. Check if a token physically exists on the device
    const hasLocalToken = !!localStorage.getItem("access_token");

    // 2. OPTIMISTIC REDIRECT (The Magic Fix)
    // If they have a token, INSTANTLY throw them to the Dashboard.
    // Do NOT show a loader here. Let the Feed skeletons handle the loading state!
    if (hasLocalToken || isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Only if we truly don't know who they are (no token, no auth)
    if (tokenValidationLoading) {
        // Return null instead of a Loader so we don't flash a spinner needlessly
        return null;
    }

    // 4. If they have no token and aren't loading, show the Landing Page / Login
    return children;
}