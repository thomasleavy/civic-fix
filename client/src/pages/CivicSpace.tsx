import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { civicSpaceService, allPublicItemsService } from '../services/api';
import IssueCard from '../components/IssueCard';
import SuggestionCard from '../components/SuggestionCard';
import WeatherDisplay from '../components/WeatherDisplay';

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

type ViewType = 'issues' | 'suggestions' | 'all';
type SortType = 'newest' | 'oldest' | 'most_liked' | 'trending';
type ViewMode = 'county' | 'all';

const CivicSpace = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isBanned } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCounty, setSelectedCounty] = useState<string>(searchParams.get('county') || '');
  const [viewType, setViewType] = useState<ViewType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>(selectedCounty ? 'county' : 'all');
  const [visibleIssuesCount, setVisibleIssuesCount] = useState<number>(9);
  const [visibleSuggestionsCount, setVisibleSuggestionsCount] = useState<number>(9);

  // Fetch public issues and suggestions for the selected county
  const { data: countyData, isLoading: isLoadingCounty, error: countyError } = useQuery({
    queryKey: ['civicSpace', selectedCounty],
    queryFn: () => civicSpaceService.getByCounty(selectedCounty),
    enabled: isAuthenticated && !isBanned && viewMode === 'county' && !!selectedCounty,
  });

  // Fetch all public issues and suggestions (regardless of location)
  const { data: allData, isLoading: isLoadingAll, error: allError } = useQuery({
    queryKey: ['allPublicItems', sortType, viewType],
    queryFn: () => allPublicItemsService.getAll(sortType, viewType),
    enabled: isAuthenticated && !isBanned && viewMode === 'all',
  });

  const data = viewMode === 'county' ? countyData : allData;
  const isLoading = viewMode === 'county' ? isLoadingCounty : isLoadingAll;
  const error = viewMode === 'county' ? countyError : allError;

  useEffect(() => {
    // Update URL when county changes
    if (selectedCounty && viewMode === 'county') {
      setSearchParams({ county: selectedCounty });
    } else {
      setSearchParams({});
    }
  }, [selectedCounty, viewMode, setSearchParams]);

  // Reset visible counts when data changes
  useEffect(() => {
    setVisibleIssuesCount(9);
    setVisibleSuggestionsCount(9);
  }, [data]);

  // Redirect if not authenticated or banned
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login', { replace: true });
    } else if (isBanned) {
      navigate('/banned', { replace: true });
    }
  }, [isAuthenticated, isBanned, navigate]);

  // Early return after all hooks
  if (!isAuthenticated || isBanned) {
    return null;
  }

  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
    // Reset visible counts when changing view type
    setVisibleIssuesCount(9);
    setVisibleSuggestionsCount(9);
  };

  const handleSortChange = (sort: SortType) => {
    setSortType(sort);
    // Reset visible counts when changing sort
    setVisibleIssuesCount(9);
    setVisibleSuggestionsCount(9);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'all') {
      setSelectedCounty('');
    }
    // Reset visible counts when changing view mode
    setVisibleIssuesCount(9);
    setVisibleSuggestionsCount(9);
  };

  const handleCountyChange = (county: string) => {
    setSelectedCounty(county);
    setViewType('all');
    if (county) {
      setViewMode('county');
    }
    // Reset visible counts when changing county
    setVisibleIssuesCount(9);
    setVisibleSuggestionsCount(9);
  };

  // Determine what to display based on viewType
  const shouldShowIssues = viewType === 'all' || viewType === 'issues';
  const shouldShowSuggestions = viewType === 'all' || viewType === 'suggestions';

  // Get visible items (limited to visible count)
  const visibleIssues = data?.issues ? data.issues.slice(0, visibleIssuesCount) : [];
  const visibleSuggestions = data?.suggestions ? data.suggestions.slice(0, visibleSuggestionsCount) : [];
  
  // Check if there are more items to show
  const hasMoreIssues = data?.issues && data.issues.length > visibleIssuesCount;
  const hasMoreSuggestions = data?.suggestions && data.suggestions.length > visibleSuggestionsCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Civic Space</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Explore issues and suggestions from different counties across Ireland, or view all public content.
          </p>

          {/* View Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              View Mode
            </label>
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => handleViewModeChange('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Locations
              </button>
              <button
                onClick={() => handleViewModeChange('county')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'county'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                By County
              </button>
            </div>

            {/* County Selection Dropdown (only shown in county mode) */}
            {viewMode === 'county' && (
              <>
                <label htmlFor="county-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select a County to View
                </label>
                <select
                  id="county-select"
                  value={selectedCounty}
                  onChange={(e) => handleCountyChange(e.target.value)}
                  className="w-full md:w-1/3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
                >
                  <option value="">-- Select a county --</option>
                  {IRISH_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
                {selectedCounty && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Viewing civic space for: <strong className="text-primary-600">{selectedCounty}</strong>
                  </p>
                )}
              </>
            )}

            {/* Sorting Options (only shown in all mode) */}
            {viewMode === 'all' && (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSortChange('newest')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortType === 'newest'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => handleSortChange('oldest')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortType === 'oldest'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Oldest
                  </button>
                  <button
                    onClick={() => handleSortChange('most_liked')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortType === 'most_liked'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Most Liked
                  </button>
                  <button
                    onClick={() => handleSortChange('trending')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortType === 'trending'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Trending
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Civic Space Content */}
        {(viewMode === 'county' && selectedCounty) || viewMode === 'all' ? (
          <div>
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading civic space content...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400">Error loading civic space content. Please try again.</p>
                </div>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {viewMode === 'all' ? 'All Public Content' : `Civic Space for ${selectedCounty}`}
                    </h2>
                    {viewMode === 'county' && selectedCounty && (
                      <WeatherDisplay county={selectedCounty} />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.issuesCount || 0}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Public Issues</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{data.suggestionsCount || 0}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">Public Suggestions</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-lg p-4 border-2 border-orange-300 dark:border-orange-800">
                      <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {(data.issues?.filter((i: any) => i.isTrending).length || 0) + (data.suggestions?.filter((s: any) => s.isTrending).length || 0)}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center">
                        <span className="mr-1">🔥</span> Trending
                      </div>
                    </div>
                  </div>

                  {/* View Type Selection Tabs */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewTypeChange('all')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          viewType === 'all'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        All ({data.issuesCount + data.suggestionsCount})
                      </button>
                      <button
                        onClick={() => handleViewTypeChange('issues')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          viewType === 'issues'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        ⚠️ Issues ({data.issuesCount || 0})
                      </button>
                      <button
                        onClick={() => handleViewTypeChange('suggestions')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          viewType === 'suggestions'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        💡 Suggestions ({data.suggestionsCount || 0})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Public Issues Section */}
                {shouldShowIssues && data.issues && data.issues.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-2xl mr-3">⚠️</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Public Issues ({data.issues.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleIssues.map((issue: any) => (
                        <IssueCard key={issue.id} issue={issue} showAppraisal={true} />
                      ))}
                    </div>
                    {hasMoreIssues && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setVisibleIssuesCount(prev => prev + 9)}
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                        >
                          Show More Issues ({data.issues.length - visibleIssuesCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Public Suggestions Section */}
                {shouldShowSuggestions && data.suggestions && data.suggestions.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-2xl mr-3">💡</span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Public Suggestions ({data.suggestions.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleSuggestions.map((suggestion: any) => (
                        <SuggestionCard key={suggestion.id} suggestion={suggestion} showAppraisal={true} />
                      ))}
                    </div>
                    {hasMoreSuggestions && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setVisibleSuggestionsCount(prev => prev + 9)}
                          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                        >
                          Show More Suggestions ({data.suggestions.length - visibleSuggestionsCount} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State for Selected View */}
                {((viewType === 'issues' && (!data.issues || data.issues.length === 0)) ||
                  (viewType === 'suggestions' && (!data.suggestions || data.suggestions.length === 0)) ||
                  (viewType === 'all' && (!data.issues || data.issues.length === 0) && (!data.suggestions || data.suggestions.length === 0))) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {viewType === 'issues' 
                          ? 'No Public Issues Yet'
                          : viewType === 'suggestions'
                          ? 'No Public Suggestions Yet'
                          : 'No Public Content Yet'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {viewType === 'issues'
                          ? `There are no public issues for ${selectedCounty} county yet.`
                          : viewType === 'suggestions'
                          ? `There are no public suggestions for ${selectedCounty} county yet.`
                          : `There are no public issues or suggestions for ${selectedCounty} county yet.`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        When users mark their {viewType === 'all' ? 'issues or suggestions' : viewType === 'issues' ? 'issues' : 'suggestions'} as public, they will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {viewMode === 'county' ? 'Select a County' : 'Select View Mode'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {viewMode === 'county' 
                  ? 'Choose a county from the dropdown above to view its civic space and see public issues and suggestions from that area.'
                  : 'Choose a view mode above to explore public issues and suggestions.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CivicSpace;
