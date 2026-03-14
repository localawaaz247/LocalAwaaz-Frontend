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
      const role = searchParams.get('role');

      if (!token) {
        navigate('/login');
        return;
      }

      localStorage.setItem('access_token', token);
      dispatch(setIsAuthenticated(true));

      try {
        // ALWAYS validate the token to fetch user details into Redux
        await dispatch(validateToken()).unwrap();

        // Route based on user role and profile status AFTER user is loaded
        if (isProfileComplete === 'true') {
          if (role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/complete-profile');
        }
      } catch (error) {
        console.error('Failed to validate token:', error);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className='flex justify-center items-center h-screen'>
      <Loader />
    </div>
  );
};

export default GoogleCallback;