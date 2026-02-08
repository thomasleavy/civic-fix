import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService, trendingService } from '../services/api';
import TrendingCard from '../components/TrendingCard';
import WeatherDisplay from '../components/WeatherDisplay';
import LocalNews from '../components/LocalNews';

const Dashboard = () => {
  const { isAuthenticated, termsAccepted, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  const hasCounty = profileData?.profile?.county;

  // Fetch trending items from all locations (not county-specific)
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingService.getAll(),
    enabled: isAuthenticated,
  });

  // Filter trending items and tag them with their type
  const trendingIssues = (trendingData?.issues || []).map((issue: any) => ({
    ...issue,
    itemType: 'issue'
  }));
  const trendingSuggestions = (trendingData?.suggestions || []).map((suggestion: any) => ({
    ...suggestion,
    itemType: 'suggestion'
  }));
  const allTrendingItems = [...trendingIssues, ...trendingSuggestions].slice(0, 6); // Show max 6 trending items

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login');
    } else if (isAdmin) {
      // Admins should not access regular dashboard, redirect to admin dashboard
      navigate('/admin-dashboard', { replace: true });
    } else if (isAuthenticated && !termsAccepted) {
      // Redirect to terms if not accepted
      navigate('/terms');
    }
    // Note: We don't force redirect to location selection here
    // Users can access location selection from the navbar dropdown
    // The dashboard will just show a message if no county is set
  }, [isAuthenticated, isAdmin, termsAccepted, navigate]);

  if (!isAuthenticated || isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
          Report issues or submit suggestions to help improve your community.
        </p>
        {hasCounty && (
          <div className="flex items-center space-x-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your submissions will be registered to: <strong className="text-gray-700 dark:text-gray-300">📍 {profileData.profile.county}</strong>
            </p>
            <WeatherDisplay county={profileData.profile.county} />
          </div>
        )}
      </div>

      {(
        <>
          {hasCounty && (
            <div className="flex flex-col sm:flex-row gap-6 mb-8">
              <button
                type="button"
                onClick={() => navigate('/issue')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-12 px-8 rounded-lg shadow-lg transition-colors text-xl"
              >
                Report Issue
              </button>
              <button
                type="button"
                onClick={() => navigate('/suggestion')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-12 px-8 rounded-lg shadow-lg transition-colors text-xl"
              >
                Give Suggestion
              </button>
            </div>
          )}
          {!hasCounty && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
              <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                <strong>Location Required:</strong> Please select your county before submitting issues or suggestions.
              </p>
              <button
                onClick={() => navigate('/location')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Select Your Location
              </button>
            </div>
          )}

          {/* Trending Section */}
          {allTrendingItems.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔥</span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
                </div>
                <Link
                  to="/civic-space"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  View All →
                </Link>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Popular issues and suggestions getting attention across Ireland
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTrendingItems.map((item: any) => (
                  <TrendingCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {allTrendingItems.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No trending items yet. Be the first to get your issue or suggestion trending!
              </p>
            </div>
          )}

          {/* Local News Section */}
          {hasCounty && (
            <LocalNews county={profileData.profile.county} />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
