import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  adminCode?: string;
}

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const password = watch('password');
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

  // Debug: Log the site key (remove after testing)
  useEffect(() => {
    if (recaptchaSiteKey) {
      console.log('reCAPTCHA Site Key:', recaptchaSiteKey);
    } else {
      console.warn('reCAPTCHA Site Key not found in environment variables');
    }
  }, [recaptchaSiteKey]);

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Check reCAPTCHA if site key is configured
    if (recaptchaSiteKey) {
      // For v2, get the current token value from the ref
      const currentToken = recaptchaRef.current?.getValue();
      
      if (!currentToken && !recaptchaToken) {
        toast.error('Please complete the reCAPTCHA verification');
        return;
      }

      // Use the current token from the ref if available (more up-to-date)
      const tokenToUse = currentToken || recaptchaToken;
      
      if (!tokenToUse) {
        toast.error('reCAPTCHA token is missing. Please complete the verification again.');
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        return;
      }

      console.log('Submitting registration with reCAPTCHA token:', tokenToUse?.substring(0, 20) + '...');
      
      setIsSubmitting(true);

      try {
        await registerUser(data.email, data.password, tokenToUse, isAdmin ? data.adminCode : undefined);
        toast.success(isAdmin ? 'Admin account created successfully! Please complete your admin profile.' : 'Account created successfully! Please complete your profile.');
        navigate(isAdmin ? '/admin-profile' : '/profile');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Registration failed');
        // Reset reCAPTCHA on error
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
          setRecaptchaToken(null);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // No reCAPTCHA configured, proceed without it
      setIsSubmitting(true);
      try {
        await registerUser(data.email, data.password, undefined, isAdmin ? data.adminCode : undefined);
        toast.success(isAdmin ? 'Admin account created successfully! Please complete your admin profile.' : 'Account created successfully! Please complete your profile.');
        navigate(isAdmin ? '/admin-profile' : '/profile');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Registration failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isAdmin ? 'Create Admin Account' : 'Create your account'}
          </h2>
          {isAdmin && (
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Register as an administrator to manage issues and suggestions for your assigned counties.
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
                type="password"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            {isAdmin && (
              <div>
                <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('adminCode', {
                    required: isAdmin ? 'Admin code is required' : false,
                  })}
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your admin code"
                />
                {errors.adminCode && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.adminCode.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the admin code you received to verify your administrator status.
                </p>
              </div>
            )}
          </div>

          {/* reCAPTCHA */}
          {recaptchaSiteKey && (
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={onRecaptchaChange}
                theme="light"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting || (recaptchaSiteKey && !recaptchaToken)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
