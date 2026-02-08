import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { profileService, adminService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  surname: string;
  dateOfBirth: string;
  address: string;
  ppsn: string;
  civicInterests: string[];
  county: string;
}

const CIVIC_INTERESTS_OPTIONS = [
  'Roads & Potholes',
  'Street Lighting',
  'Litter & Waste Management',
  'Parks & Green Spaces',
  'Public Transport',
  'Cycling Infrastructure',
  'Pedestrian Safety',
  'Community Facilities',
  'Environmental Issues',
  'Traffic Management',
  'Accessibility',
  'Drainage & Flooding',
  'Public Amenities',
  'Urban Planning',
  'Community Engagement',
];

// 26 Counties of Ireland (Republic of Ireland)
const IRISH_COUNTIES = [
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Donegal',
  'Dublin',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
];

const Profile = () => {
  const { isAuthenticated, isAdmin, isBanned } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const { data, isLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
    retry: false, // Don't retry on error
  });

  // Redirect if banned
  useEffect(() => {
    if (isBanned) {
      navigate('/banned', { replace: true });
    }
  }, [isBanned, navigate]);

  // Fetch admin locations if user is an admin
  const { data: adminLocationsData } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.getAdminLocations(),
    enabled: isAuthenticated && isAdmin,
  });

  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileService.updateProfile(data),
    onSuccess: async (response) => {
      toast.success('Profile saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Check if profile is complete from the response
      const profile = response?.profile;
      const isComplete = 
        profile &&
        profile.first_name &&
        profile.surname &&
        profile.date_of_birth &&
        profile.address &&
        profile.ppsn &&
        profile.county;

      if (isComplete) {
        // Profile is complete, check if user is admin
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // If admin, redirect to admin dashboard (or admin profile if locations not set)
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
            // Terms accepted, go to dashboard
            navigate('/dashboard', { replace: true });
          } else {
            // Terms not accepted, go to terms page
            navigate('/terms', { replace: true });
          }
        } else {
          // Fallback: go to dashboard
          navigate('/dashboard', { replace: true });
        }
      }
      // If profile is incomplete, stay on profile page (user can continue filling it out)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProfileFormData>();
  const [isProfileCreated, setIsProfileCreated] = useState(false);

  // Check if profile is complete (all required fields filled)
  const isProfileComplete = (profile: any) => {
    return profile &&
      profile.first_name &&
      profile.surname &&
      profile.date_of_birth &&
      profile.address &&
      profile.ppsn &&
      profile.county;
  };

  useEffect(() => {
    if (data?.profile) {
      const profile = data.profile;
      const isComplete = isProfileComplete(profile);
      setIsProfileCreated(isComplete);
      
      setValue('firstName', profile.first_name || '');
      setValue('surname', profile.surname || '');
      
      // Format date_of_birth for HTML date input (YYYY-MM-DD format)
      let formattedDate = '';
      if (profile.date_of_birth) {
        const date = new Date(profile.date_of_birth);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for HTML date input
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      }
      setValue('dateOfBirth', formattedDate);
      
      setValue('address', profile.address || '');
      setValue('ppsn', profile.ppsn || '');
      setValue('county', profile.county || '');
      setSelectedInterests(profile.civic_interests || []);
    } else {
      setIsProfileCreated(false);
    }
  }, [data, setValue]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const onSubmit = (formData: ProfileFormData) => {
    const profile = data?.profile;
    const isComplete = profile ? isProfileComplete(profile) : false;
    
    if (isComplete) {
      // Profile is complete: only send address, civicInterests, and county (updatable fields)
      mutation.mutate({
        firstName: '',
        surname: '',
        dateOfBirth: '',
        address: formData.address,
        ppsn: '',
        civicInterests: selectedInterests,
        county: formData.county,
      });
    } else {
      // Profile incomplete: send all fields including county (create or complete profile)
      mutation.mutate({
        ...formData,
        civicInterests: selectedInterests,
      });
    }
  };

  if (isBanned) {
    return null; // Will redirect via useEffect
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  // Note: We don't return early on error - we still show the form
  // so users can fill it out even if the server is down

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>
        
        {/* Show error message if API fails */}
        {profileError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>⚠️ Connection Error:</strong> Unable to load your profile from the server. 
              The server may be down. Please check your connection and try again.
            </p>
          </div>
        )}
        
        {/* Admin Locations Display */}
        {isAdmin && adminLocationsData?.locations && adminLocationsData.locations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
              📍 Admin County Assignments
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
              You are responsible for managing issues and suggestions in the following counties:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {adminLocationsData.locations.map((county: string) => (
                <span
                  key={county}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md text-sm font-medium"
                >
                  {county}
                </span>
              ))}
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
              To update your county assignments, visit <Link to="/admin-profile" className="underline font-medium">Admin Profile</Link>.
            </p>
          </div>
        )}

        {!isProfileCreated && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              ⚠️ Profile Completion Required
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              You must complete all required fields (First Name, Surname, Date of Birth, Address, PPSN, and County) before you can access other parts of the site. 
              This information cannot be changed after submission.
            </p>
          </div>
        )}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isProfileCreated 
            ? 'Update your profile information below. Note: Name, Surname, Date of Birth, and PPSN cannot be changed.'
            : 'Complete your profile to help us understand your civic interests and improve our services.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
                {isProfileCreated && data?.profile?.first_name && <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">(Cannot be changed)</span>}
              </label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                disabled={isProfileCreated && data?.profile?.first_name}
                readOnly={isProfileCreated && data?.profile?.first_name}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  isProfileCreated && data?.profile?.first_name 
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-900 dark:text-gray-100' 
                    : 'bg-white dark:bg-gray-700'
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Surname
                {isProfileCreated && data?.profile?.surname && <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">(Cannot be changed)</span>}
              </label>
              <input
                {...register('surname', { required: 'Surname is required' })}
                type="text"
                disabled={isProfileCreated && data?.profile?.surname}
                readOnly={isProfileCreated && data?.profile?.surname}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                  isProfileCreated && data?.profile?.surname 
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-900 dark:text-gray-100' 
                    : 'bg-white dark:bg-gray-700'
                }`}
                placeholder="Doe"
              />
              {errors.surname && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.surname.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date of Birth
              {isProfileCreated && data?.profile?.date_of_birth && <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">(Cannot be changed)</span>}
            </label>
            <input
              {...register('dateOfBirth', { required: 'Date of birth is required' })}
              type="date"
              disabled={isProfileCreated && data?.profile?.date_of_birth}
              readOnly={isProfileCreated && data?.profile?.date_of_birth}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                isProfileCreated && data?.profile?.date_of_birth 
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-900 dark:text-gray-100' 
                  : 'bg-white dark:bg-gray-700'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              {...register('address', { required: 'Address is required' })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="123 Main Street, Dublin, Ireland"
            />
            {errors.address && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              County <span className="text-red-500">*</span>
            </label>
            <select
              {...register('county', { required: 'County is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">-- Select your county --</option>
              {IRISH_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
            {errors.county && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.county.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your county determines where your issues and suggestions are registered.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              PPSN (Personal Public Service Number)
              {isProfileCreated && data?.profile?.ppsn && <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">(Cannot be changed)</span>}
            </label>
            <input
              {...register('ppsn', {
                required: 'PPSN is required',
              })}
              type="text"
              disabled={isProfileCreated && data?.profile?.ppsn}
              readOnly={isProfileCreated && data?.profile?.ppsn}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white ${
                isProfileCreated && data?.profile?.ppsn 
                  ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-900 dark:text-gray-100' 
                  : 'bg-white dark:bg-gray-700'
              }`}
              placeholder="1234567A"
              maxLength={9}
            />
            {errors.ppsn && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.ppsn.message}</p>
            )}
            {!isProfileCreated && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Format: 7 digits followed by 1-2 letters (e.g., 1234567A)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Civic Interests
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select the civic areas you're interested in. This helps us understand what matters most to residents in your area:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CIVIC_INTERESTS_OPTIONS.map((interest) => (
                <label
                  key={interest}
                  className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedInterests.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{interest}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
