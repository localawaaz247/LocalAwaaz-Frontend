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
      // Extract parameters from the backend redirect URL
      const token = searchParams.get('token');
      const isProfileComplete = searchParams.get('isProfileComplete');
      const role = searchParams.get('role');

      if (!token) {
        navigate('/login');
        return;
      }

      // Store token as 'access_token' per your configuration
      localStorage.setItem('access_token', token);
      dispatch(setIsAuthenticated(true));

      if (isProfileComplete === 'true') {
        try {
          // Validate the token first
          await dispatch(validateToken()).unwrap();

          // Route based on user role
          if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          navigate('/login'); // Redirect to login if token validation fails
        }
      } else {
        navigate('/complete-profile');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className='flex justify-center items-center h-screen '>
      <Loader />
    </div>
  );
};

export default GoogleCallback;