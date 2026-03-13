import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loader from "../components/Loader"; // Adjust path as needed

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
    // 1. Pull from the authentication slice 
    const { user, isAuthenticated, tokenValidationLoading } = useSelector((state) => state.auth);

    // 2. IMPORTANT: If the app is currently validating the token (e.g., page refresh), show loader 
    if (tokenValidationLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background relative z-[100]">
                <Loader />
            </div>
        );
    }

    // 3. Not authenticated at all? Send to login. 
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // 4. Admin authorization: Route requires admin, but user is a normal user. 
    // Direct normal users securely to /dashboard if they try to access /admin
    if (requireAdmin && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // 5. Passed all checks. Return content. 
    return children;
};