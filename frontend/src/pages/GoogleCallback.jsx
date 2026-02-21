import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setIsAuthenticated, validateToken } from '../reducer/authReducer';
import Loader from '../components/Loader';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const token = searchParams.get('token');
      const isProfileComplete = searchParams.get('isProfileComplete');
      

      if (!token) {
        navigate('/login');
        return;
      }

      // Store token
      if(token){
        localStorage.setItem('access_token', token);
        dispatch(setIsAuthenticated(true));
        
        // Fetch user data
        try {
          await dispatch(validateToken()).unwrap();
        } catch (error) {
          console.error('Failed to validate token:', error);
        }
      }

      if (isProfileComplete === 'true') {
        navigate('/dashboard');
      } else {
        navigate('/complete-profile');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return <Loader/>; 
};

export default GoogleCallback;