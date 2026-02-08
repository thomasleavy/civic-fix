import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';

// 32 Counties of Ireland (Republic of Ireland)
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

const LocationSelection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState<string>('');

  // Get existing profile to check if county is already set
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  const hasExistingCounty = profileData?.profile?.county;

  const mutation = useMutation({
    mutationFn: (county: string) => profileService.updateCounty(county),
    onSuccess: () => {
      toast.success(hasExistingCounty ? 'Location updated successfully!' : 'Location selected successfully!');
      // If this is first time selecting, go to terms. Otherwise, go back to dashboard
      if (hasExistingCounty) {
        navigate('/dashboard');
      } else {
        navigate('/terms');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save location');
    },
  });

  // Pre-select existing county if available
  useEffect(() => {
    if (profileData?.profile?.county) {
      setSelectedCounty(profileData.profile.county);
    }
  }, [profileData]);

  if (!isAuthenticated) {
    navigate('/civicfix?tab=login');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounty) {
      toast.error('Please select your county');
      return;
    }
    mutation.mutate(selectedCounty);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {hasExistingCounty ? 'Update Your Location' : 'Select Your Location'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {hasExistingCounty 
                ? 'Update the county where you are based. This will be used to register all your issues and suggestions to your local area.'
                : 'Please select the county where you are based. This will be used to register all your issues and suggestions to your local area.'}
            </p>
            {hasExistingCounty && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                Current location: <strong>{profileData.profile.county}</strong>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                County <span className="text-red-500">*</span>
              </label>
              <select
                id="county"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
              >
                <option value="">-- Select your county --</option>
                {IRISH_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                All issues and suggestions you submit will be registered to this county.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Your location helps us ensure that issues and suggestions 
                are properly categorised and directed to the relevant local authorities. You can 
                update your location later from your profile settings.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={!selectedCounty || mutation.isPending}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {mutation.isPending ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LocationSelection;
