import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api';

const Analytics = () => {
  const { isAuthenticated, isBanned } = useAuth();
  const navigate = useNavigate();
  const [timePeriod, setTimePeriod] = useState<'7' | '30' | '90' | '365'>('30');

  // Fetch analytics data - all hooks must be called before any early returns
  const { data: categoryData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: () => analyticsService.getCategoryAnalytics(),
    enabled: isAuthenticated && !isBanned,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends', timePeriod],
    queryFn: () => analyticsService.getTrendsOverTime(timePeriod),
    enabled: isAuthenticated && !isBanned,
  });

  const { data: geographicData, isLoading: geographicLoading } = useQuery({
    queryKey: ['analytics', 'geographic'],
    queryFn: () => analyticsService.getGeographicDistribution(),
    enabled: isAuthenticated && !isBanned,
  });

  const { data: overallStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'overall'],
    queryFn: () => analyticsService.getOverallStats(),
    enabled: isAuthenticated && !isBanned,
  });

  // Redirect if not authenticated or banned
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login', { replace: true });
    } else if (isBanned) {
      navigate('/banned', { replace: true });
    }
  }, [isAuthenticated, isBanned, navigate]);

  if (!isAuthenticated || isBanned) {
    return null;
  }

  // Helper function to format category names
  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get color for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'accepted':
        return 'bg-purple-500';
      case 'under_review':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Insights into community issues and suggestions
        </p>
      </div>

      {/* Overall Statistics */}
      {statsLoading ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading statistics...</div>
      ) : overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Issues</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totals.issues}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Suggestions</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totals.suggestions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totals.users}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Resolved</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{overallStats.totals.resolved}</p>
          </div>
        </div>
      )}

      {/* Category Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Most Reported Categories</h2>
        {categoriesLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading categories...</div>
        ) : categoryData?.categories && categoryData.categories.length > 0 ? (
          <div className="space-y-4">
            {categoryData.categories.map((item: any, index: number) => (
              <div key={item.category} className="flex items-center space-x-4">
                <div className="w-8 text-center font-bold text-gray-600 dark:text-gray-400">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCategory(item.category)}
                    </span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {item.total} total
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${(item.total / categoryData.categories[0].total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.issues} issues</span>
                    <span>{item.suggestions} suggestions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">No category data available</div>
        )}
      </div>

      {/* Trends Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trends Over Time</h2>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as '7' | '30' | '90' | '365')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
        {trendsLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading trends...</div>
        ) : trendsData ? (
          <div className="space-y-6">
            {/* Simple bar chart representation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Issues Created</h3>
              <div className="flex items-end space-x-2 h-64">
                {trendsData.issues.map((item: any, index: number) => {
                  const maxCount = Math.max(...trendsData.issues.map((i: any) => i.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-red-500 rounded-t hover:bg-red-600 transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${item.count} issues`}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggestions Created</h3>
              <div className="flex items-end space-x-2 h-64">
                {trendsData.suggestions.map((item: any, index: number) => {
                  const maxCount = Math.max(...trendsData.suggestions.map((i: any) => i.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${item.count} suggestions`}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resolved Items</h3>
              <div className="flex items-end space-x-2 h-64">
                {trendsData.resolved.map((item: any, index: number) => {
                  const maxCount = Math.max(...trendsData.resolved.map((i: any) => i.count), 1);
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${item.date}: ${item.count} resolved`}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">No trends data available</div>
        )}
      </div>

      {/* Geographic Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Geographic Distribution</h2>
        {geographicLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading geographic data...</div>
        ) : geographicData?.distribution && geographicData.distribution.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    County
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Suggestions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status Breakdown
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {geographicData.distribution.map((item: any) => (
                  <tr key={item.county}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.county}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">
                      {item.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.issues.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.suggestions.total}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs">
                          Resolved: {item.issues.resolved + item.suggestions.resolved}
                        </span>
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                          Under Review: {item.issues.underReview + item.suggestions.underReview}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs">
                          In Progress: {item.issues.inProgress + item.suggestions.inProgress}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">No geographic data available</div>
        )}
      </div>

      {/* Status Breakdown */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Issues by Status</h3>
            <div className="space-y-3">
              {overallStats.issuesByStatus.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                        style={{
                          width: `${(item.count / overallStats.totals.issues) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Suggestions by Status</h3>
            <div className="space-y-3">
              {overallStats.suggestionsByStatus.map((item: any) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {item.status.replace('_', ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                        style={{
                          width: `${(item.count / overallStats.totals.suggestions) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
