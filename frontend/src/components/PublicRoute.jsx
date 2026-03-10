import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "./Loader";

export function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();

   

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
