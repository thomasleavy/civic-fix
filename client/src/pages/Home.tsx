import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  adminCode?: string;
}

const Home = () => {
  const { isAuthenticated, login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  
  // Debug: Log reCAPTCHA site key (remove in production)
  useEffect(() => {
    if (activeTab === 'register') {
      console.log('reCAPTCHA Site Key:', recaptchaSiteKey ? 'Loaded' : 'Missing');
      console.log('reCAPTCHA Site Key Value:', recaptchaSiteKey || 'Not set');
    }
  }, [activeTab, recaptchaSiteKey]);

  // Single landing video: local file (optional), fallback URL for live site (Pexels blocks direct embed, so use a CORS-friendly placeholder)
  // Credit: Keppy on Pexels - https://www.pexels.com/@keppy/ (when using local file)
  const videoLocal = '/videos/landing-page-video.mp4';
  const videoRemote = 'https://lorem.video/1280x720'; // works on live site; replace with your own hosted MP4 if you want a specific video
  const videoCredit = { name: 'Keppy', url: 'https://www.pexels.com/@keppy/' };
  // On live site (gh-pages) there is no local video; use remote immediately so video appears without a failed request
  const isLiveSite = typeof window !== 'undefined' && window.location.origin.includes('github.io');
  const [videoSrc, setVideoSrc] = useState(() => (isLiveSite ? videoRemote : videoLocal));
  const videoRefs = useRef<HTMLVideoElement | null>(null);

  const handleVideoError = () => {
    if (videoSrc === videoLocal) {
      setVideoSrc(videoRemote);
      const el = videoRefs.current;
      if (el) {
        el.src = videoRemote;
        el.load();
        el.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const currentVideo = videoRefs.current;
    if (currentVideo) {
      currentVideo.src = videoSrc;
      currentVideo.load();
      currentVideo.play().catch((e) => console.log('Video autoplay prevented:', e));
    }
  }, [videoSrc]);

  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();

  // Check URL params to determine which form to show
  useEffect(() => {
    const tab = searchParams.get('tab');
    const admin = searchParams.get('admin') === 'true';
    
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab);
      setIsAdmin(admin);
    } else if (admin) {
      setActiveTab('register');
      setIsAdmin(true);
    }
  }, [searchParams]);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
          return;
        }
      }
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const onLoginSubmit = async (data: LoginFormData) => {
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
          navigate('/banned', { replace: true });
          return;
        }
      } catch (banError: any) {
        if (banError?.message !== 'Ban check timeout' && banError?.response?.status !== 429) {
          console.warn('Ban status check failed, continuing with login:', banError);
        }
      }
      
      // Fetch profile to check completion
      try {
        const profileResponse = await profileService.getProfile();
        const profile = profileResponse?.profile;
        
        const isProfileComplete = 
          profile &&
          profile.first_name &&
          profile.surname &&
          profile.address &&
          profile.ppsn &&
          profile.county;

        if (!isProfileComplete) {
          navigate('/profile', { replace: true });
          return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
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
              navigate('/admin-dashboard', { replace: true });
            }
            return;
          }
          
          if (userData.termsAccepted) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/terms', { replace: true });
          }
        } else {
          navigate('/profile', { replace: true });
        }
      } catch (profileError) {
        navigate('/profile', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (recaptchaSiteKey) {
      const currentToken = recaptchaRef.current?.getValue();
      
      if (!currentToken && !recaptchaToken) {
        toast.error('Please complete the reCAPTCHA verification');
        return;
      }

      const tokenToUse = currentToken || recaptchaToken;
      
      if (!tokenToUse) {
        toast.error('reCAPTCHA token is missing. Please complete the verification again.');
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        return;
      }

      setIsSubmitting(true);
      try {
        await registerUser(data.email, data.password, tokenToUse, isAdmin ? data.adminCode : undefined);
        toast.success(isAdmin ? 'Admin account created successfully! Please complete your admin profile.' : 'Account created successfully! Please complete your profile.');
        navigate(isAdmin ? '/admin-profile' : '/profile');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Registration failed');
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
          setRecaptchaToken(null);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
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

  if (isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        {/* Hero Section with Video Background */}
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          {/* Video Background */}
          <video
            ref={(el) => { 
              videoRefs.current = el;
              // Set initial source when ref is attached
              if (el) {
                el.src = videoSrc;
                el.load();
              }
            }}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            loop
            onError={handleVideoError}
          />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
          
          {/* Video Attribution */}
          <div className="absolute bottom-2 right-2 z-20">
            <a 
              href={videoCredit.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white text-xs transition-colors flex items-center gap-1"
            >
              <span>Video by</span>
              <span className="underline">{videoCredit.name}</span>
              <span>on Pexels</span>
            </a>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 drop-shadow-2xl">
              CivicFix
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/95 font-semibold mb-4 drop-shadow-lg max-w-2xl">
              Your Voice, Your Community, Your Change
            </p>
            <p className="text-sm sm:text-base text-white/90 max-w-xl drop-shadow-md mb-8">
              Connect directly with your local council. Report issues, share ideas, and help shape your community's future.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => navigate('/issue')}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg shadow-xl transition-all hover:scale-105"
              >
                Report Issue
              </button>
              <button
                onClick={() => navigate('/suggestion')}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg shadow-xl transition-all hover:scale-105"
              >
                Give Suggestion
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Empowering Communities Through Direct Engagement
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              CivicFix bridges the gap between citizens and local government. Report infrastructure issues like potholes and broken streetlights, 
              or propose community improvements such as new parks, cycling paths, and public facilities. Your feedback matters, and with CivicFix, 
              it reaches the right people.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome message if no tab is selected
  if (!activeTab) {
    return (
      <div className="relative min-h-screen">
        {/* Hero Section with Video Background */}
        <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
          {/* Video Background */}
          <video
            ref={(el) => { 
              videoRefs.current = el;
              // Set initial source when ref is attached
              if (el) {
                el.src = videoSrc;
                el.load();
              }
            }}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            loop
            onError={handleVideoError}
          />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
          
          {/* Video Attribution */}
          <div className="absolute bottom-2 right-2 z-20">
            <a 
              href={videoCredit.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white text-xs transition-colors flex items-center gap-1"
            >
              <span>Video by</span>
              <span className="underline">{videoCredit.name}</span>
              <span>on Pexels</span>
            </a>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-4 drop-shadow-2xl">
              CivicFix
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-white/95 font-semibold mb-6 drop-shadow-lg max-w-3xl">
              Your Voice, Your Community, Your Change
            </p>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mb-8 drop-shadow-md">
              Connect directly with your local council. Report issues, share ideas, and help shape your community's future.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => {
                  setActiveTab('login');
                  navigate('/civicfix?tab=login', { replace: true });
                }}
                className="px-8 py-3 bg-white/95 hover:bg-white text-primary-600 rounded-lg font-semibold text-lg shadow-xl transition-all hover:scale-105"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  navigate('/civicfix?tab=register', { replace: true });
                }}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg shadow-xl transition-all hover:scale-105"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {/* Content Section Below Hero */}
        <div className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Empowering Communities Through Direct Engagement
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              CivicFix bridges the gap between citizens and local government. Report infrastructure issues like potholes and broken streetlights, 
              or propose community improvements such as new parks, cycling paths, and public facilities. Your feedback matters, and with CivicFix, 
              it reaches the right people.
            </p>
            <div className="mt-8">
              <button
                onClick={() => {
                  setActiveTab('register');
                  setIsAdmin(true);
                  navigate('/civicfix?tab=register&admin=true', { replace: true });
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-lg transition-all hover:scale-105"
              >
                Register as Administrator
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Hero Section with Video Background */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {/* Video Background */}
        <video
          ref={(el) => { 
            videoRefs.current = el;
            // Set initial source when ref is attached
            if (el) {
              el.src = videoSrc;
              el.load();
            }
          }}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          preload="auto"
          loop
          className="absolute inset-0 w-full h-full object-cover"
          onError={handleVideoError}
        />
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>
        
        {/* Video Attribution */}
        <div className="absolute bottom-2 right-2 z-20">
          <a 
            href={videoCredit.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white text-xs transition-colors flex items-center gap-1"
          >
            <span>Video by</span>
            <span className="underline">{videoCredit.name}</span>
            <span>on Pexels</span>
          </a>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 drop-shadow-2xl">
            CivicFix
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/95 font-semibold mb-4 drop-shadow-lg max-w-2xl">
            Your Voice, Your Community, Your Change
          </p>
          <p className="text-sm sm:text-base text-white/90 max-w-xl drop-shadow-md">
            Connect directly with your local council. Report issues, share ideas, and help shape your community's future.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            {/* Tab Selector */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setIsAdmin(false);
                  navigate('/civicfix?tab=login', { replace: true });
                }}
                className={`flex-1 py-2 px-4 text-center font-medium ${
                  activeTab === 'login'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setIsAdmin(false);
                  navigate('/civicfix?tab=register', { replace: true });
                }}
                className={`flex-1 py-2 px-4 text-center font-medium ${
                  activeTab === 'register'
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  {...loginForm.register('email', { required: 'Email is required' })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Email address"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  {...loginForm.register('password', { required: 'Password is required' })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Password"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              {isAdmin && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Registering as Administrator
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  {...registerForm.register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Email address"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Password"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  {...registerForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === registerForm.watch('password') || 'Passwords do not match',
                  })}
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Confirm password"
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admin Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerForm.register('adminCode', {
                      required: isAdmin ? 'Admin code is required' : false,
                    })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your admin code"
                  />
                  {registerForm.formState.errors.adminCode && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                      {registerForm.formState.errors.adminCode.message}
                    </p>
                  )}
                </div>
              )}
              {!isAdmin && (
                <div className="flex justify-center my-4">
                  {recaptchaSiteKey ? (
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={recaptchaSiteKey}
                      onChange={onRecaptchaChange}
                      theme="light"
                    />
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ reCAPTCHA is not configured. Please set VITE_RECAPTCHA_SITE_KEY in your .env file.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || (recaptchaSiteKey && !recaptchaToken)}
                className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}

          {/* Admin Registration Link */}
          {activeTab === 'register' && !isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                Are you an administrator?
              </p>
              <button
                onClick={() => {
                  setIsAdmin(true);
                  navigate('/civicfix?tab=register&admin=true', { replace: true });
                }}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              >
                Register as Admin
              </button>
            </div>
          )}

          {/* Switch between forms */}
          {activeTab === 'login' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setActiveTab('register');
                  navigate('/civicfix?tab=register', { replace: true });
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm"
              >
                Don't have an account? Register
              </button>
            </div>
          )}
          {activeTab === 'register' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setIsAdmin(false);
                  navigate('/civicfix?tab=login', { replace: true });
                }}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
