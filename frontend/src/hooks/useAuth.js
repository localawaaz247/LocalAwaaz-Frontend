import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { validateToken, logoutUser } from '../reducer/authReducer';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error, tokenValidationLoading } = useSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token && !isAuthenticated) {
        try {
           await dispatch(validateToken()).unwrap();
           
        } catch (error) {
          console.error('Token validation failed:', error);
          
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, [dispatch, isAuthenticated]);

  const logout = () => {
    dispatch(logoutUser());
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    tokenValidationLoading,
    isInitialized,
    logout
  };
};
