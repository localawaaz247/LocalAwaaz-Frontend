import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../components/Loader"; // Adjust path as needed

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, isAuthenticated, tokenValidationLoading } = useSelector((state) => state.auth);
    const location = useLocation();

    // 1. Show loader while validating token
    if (tokenValidationLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background relative z-[100]">
                <Loader />
            </div>
        );
    }

    // 2. Not logged in at all? Send to login.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Authenticated, but user object hasn't loaded into Redux yet -> Wait for it
    if (isAuthenticated && !user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background relative z-[100]">
                <Loader />
            </div>
        );
    }

    // 4. Admin authorization
    if (requireAdmin && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // ------------------------------------------------------------------
    // 5. PROFILE COMPLETION GUARDS (THE FIX)
    // ------------------------------------------------------------------
    
    // Convert to an absolute boolean. 
    // If the backend drops the field (making it undefined), this safely turns it into 'false'.
    const hasCompleteProfile = Boolean(user.isProfileComplete);

    // Guard A: If profile is INCOMPLETE, strictly trap them on the complete-profile page.
    if (!hasCompleteProfile && location.pathname !== "/complete-profile") {
        return <Navigate to="/complete-profile" replace />;
    }

    // Guard B: If profile IS COMPLETE, stop them from manually going back to the setup page.
    if (hasCompleteProfile && location.pathname === "/complete-profile") {
        return <Navigate to="/dashboard" replace />;
    }

    // 6. Passed all checks. Return content. 
    return children;
};