import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
}

const Login = () => {
  const { login, termsAccepted, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is admin
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
          return;
        }
      }
      // Regular user - redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      
      // Check if user is banned first (with timeout to prevent blocking)
      try {
        const { banService } = await import('../services/api');
        const banResponse = await Promise.race([
          banService.getBanDetails(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ban check timeout')), 5000)
          )
        ]) as any;
        
        if (banResponse?.banned) {
          // User is banned, redirect to banned page
          navigate('/banned', { replace: true });
          return;
        }
      } catch (banError: any) {
        // If ban check fails or times out, continue with normal flow
        // Don't log errors for timeouts or network issues - they're expected
        if (banError?.message !== 'Ban check timeout' && banError?.response?.status !== 429) {
          console.warn('Ban status check failed, continuing with login:', banError);
        }
      }
      
      // Fetch profile to check completion
      try {
        const profileResponse = await profileService.getProfile();
        const profile = profileResponse?.profile;
        
        // Check if profile is complete
        const isProfileComplete = 
          profile &&
          profile.first_name &&
          profile.surname &&
          profile.address &&
          profile.ppsn &&
          profile.county;

        if (!isProfileComplete) {
          // Profile incomplete, redirect to profile
          navigate('/profile', { replace: true });
          return;
        }

        // Check if user is admin
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // If admin, check if they have locations set
          if (userData.role === 'admin') {
            try {
              const { adminService } = await import('../services/api');
              const locationsResponse = await adminService.getAdminLocations();
              if (locationsResponse.locations && locationsResponse.locations.length > 0) {
                navigate('/admin-dashboard', { replace: true });
              } else {
                navigate('/admin-profile', { replace: true });
              }
            } catch (error) {
              // If error, try admin dashboard anyway
              navigate('/admin-dashboard', { replace: true });
            }
            return;
          }
          
          // Regular user flow
          if (userData.termsAccepted) {
            // Terms already accepted, go directly to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            // Terms not accepted, go to terms page
            navigate('/terms', { replace: true });
          }
        } else {
          // Fallback: navigate to profile to complete it
          navigate('/profile', { replace: true });
        }
      } catch (profileError) {
        // If profile fetch fails, assume incomplete and redirect to profile
        navigate('/profile', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to CivicFix
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Don't have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
