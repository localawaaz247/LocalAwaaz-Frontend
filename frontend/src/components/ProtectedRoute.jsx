import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import Loader from "./Loader";


export function ProtectedRoute({children}){
    const { isAuthenticated, tokenValidationLoading, isInitialized } = useAuth();

    if (!isInitialized || tokenValidationLoading) {
        return <div className="h-screen flex justify-center items-center"><Loader /></div>;
    }

    if(!isAuthenticated){
        return <Navigate to="/login" replace/>
    }
   
    return children;

}
