import { useSelector } from "react-redux"; // 👇 Changed from useAuth to useSelector
import { Navigate } from "react-router-dom";
import Loader from "./Loader";

export function PublicRoute({ children }) {
    // 👇 Grab tokenValidationLoading from Redux as well
    const { isAuthenticated, tokenValidationLoading } = useSelector((state) => state.auth);

    // 👇 Show loader while we check if the token is valid on refresh
    if (tokenValidationLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background relative z-[100]">
                <Loader />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}