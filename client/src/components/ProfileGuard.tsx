import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';

interface ProfileGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard that ensures users have completed their profile
 * before accessing protected routes. Redirects to /profile if incomplete.
 */
export const ProfileGuard = ({ children }: ProfileGuardProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: profileData, isLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
    retry: false, // Don't retry on error to avoid infinite loops
  });

  // Check if user is banned (use AuthContext's ban status instead of duplicating the query)
  const { isBanned } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return; // Let other guards handle authentication
    }

    // Check if user is banned first (using AuthContext's isBanned)
    if (isBanned) {
      navigate('/banned', { replace: true });
      return;
    }

    // If there's an error (e.g., server down), don't redirect - allow access
    // The user might have a complete profile, we just can't verify it right now
    if (profileError) {
      return; // Don't redirect on error, allow access
    }

    if (isLoading) {
      return; // Wait for profile to load
    }

    const profile = profileData?.profile;

    // Check if profile is complete
    // Required fields: firstName, surname, address, ppsn, county
    const isProfileComplete = 
      profile &&
      profile.first_name &&
      profile.surname &&
      profile.address &&
      profile.ppsn &&
      profile.county;

    if (!isProfileComplete) {
      // Redirect to profile page if incomplete
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, isLoading, profileData, isBanned, profileError, navigate]);

  // Don't render children if user is banned
  if (isBanned) {
    return null; // Will redirect via useEffect
  }

  // Don't render children if profile is incomplete
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If there's an error (e.g., server down), allow access
  // Don't block the user if we can't verify their profile
  if (profileError) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  const profile = profileData?.profile;
  const isProfileComplete = 
    profile &&
    profile.first_name &&
    profile.surname &&
    profile.address &&
    profile.ppsn &&
    profile.county;

  if (!isProfileComplete) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};
