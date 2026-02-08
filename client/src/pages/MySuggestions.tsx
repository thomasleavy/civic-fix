import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { suggestionService } from '../services/api';
import { Link } from 'react-router-dom';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  images?: string[];
  case_id?: string;
  county?: string;
  admin_note?: string;
  admin_action_at?: string;
  admin_action_email?: string;
  isPublic?: boolean;
  is_public?: boolean;
}

const MySuggestions = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['mySuggestions'],
    queryFn: () => suggestionService.getMySuggestions(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please log in to view your suggestions</h1>
          <Link to="/civicfix?tab=login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'implemented':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get unique categories and statuses for filter dropdowns
  const categories = useMemo(() => {
    if (!data?.suggestions) return [];
    const uniqueCategories = new Set(data.suggestions.map((suggestion: Suggestion) => suggestion.category));
    return Array.from(uniqueCategories).sort();
  }, [data?.suggestions]);

  const statuses = useMemo(() => {
    if (!data?.suggestions) return [];
    const uniqueStatuses = new Set(data.suggestions.map((suggestion: Suggestion) => suggestion.status));
    return Array.from(uniqueStatuses).sort();
  }, [data?.suggestions]);

  // Filter and sort suggestions
  const filteredAndSortedSuggestions = useMemo(() => {
    if (!data?.suggestions) return [];

    let filtered = [...data.suggestions];

    // Search filter (case ID, title, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((suggestion: Suggestion) => {
        const caseId = suggestion.case_id?.toLowerCase() || '';
        const title = suggestion.title?.toLowerCase() || '';
        const description = suggestion.description?.toLowerCase() || '';
        return caseId.includes(query) || title.includes(query) || description.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((suggestion: Suggestion) => suggestion.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((suggestion: Suggestion) => suggestion.category === categoryFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((suggestion: Suggestion) => {
        const suggestionDate = new Date(suggestion.created_at);
        return suggestionDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((suggestion: Suggestion) => {
        const suggestionDate = new Date(suggestion.created_at);
        return suggestionDate <= toDate;
      });
    }

    // Sort
    filtered.sort((a: Suggestion, b: Suggestion) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'status_asc':
          return a.status.localeCompare(b.status);
        case 'status_desc':
          return b.status.localeCompare(a.status);
        case 'category_asc':
          return a.category.localeCompare(b.category);
        case 'category_desc':
          return b.category.localeCompare(a.category);
        default:
          return 0;
      }
    });

    return filtered;
  }, [data?.suggestions, searchQuery, statusFilter, categoryFilter, sortBy, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('date_desc');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">My Suggestions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          View all the suggestions you've submitted for community improvements.
        </p>
      </div>

      {/* Search and Filter Section */}
      {!isLoading && data?.suggestions && data.suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by case ID, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status: string) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>
                      {formatCategory(category)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="date_desc">Date (Newest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="status_asc">Status (A-Z)</option>
                  <option value="status_desc">Status (Z-A)</option>
                  <option value="category_asc">Category (A-Z)</option>
                  <option value="category_desc">Category (Z-A)</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Results Count */}
            {hasActiveFilters && (
              <div className="text-sm text-gray-600">
                Showing {filteredAndSortedSuggestions.length} of {data.suggestions.length} suggestions
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">Loading your suggestions...</div>
      ) : data?.suggestions?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">You haven't submitted any suggestions yet.</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Submit a Suggestion
          </Link>
        </div>
      ) : filteredAndSortedSuggestions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">No suggestions match your search criteria.</p>
          <button
            onClick={clearFilters}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Accepted Suggestions Section */}
          {filteredAndSortedSuggestions.filter((s: Suggestion) => s.status === 'accepted').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                Accepted Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedSuggestions
                  .filter((s: Suggestion) => s.status === 'accepted')
                  .map((suggestion: Suggestion) => (
                    <Link
                      key={suggestion.id}
                      to={`/suggestions/${suggestion.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
                    >
                      {suggestion.images && suggestion.images.length > 0 && (() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        const serverBaseUrl = apiBaseUrl.replace('/api', '');
                        const imageUrl = suggestion.images[0].startsWith('http') 
                          ? suggestion.images[0]
                          : `${serverBaseUrl}${suggestion.images[0]}`;
                        
                        return (
                          <img
                            src={imageUrl}
                            alt={suggestion.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        );
                      })()}
                      <div className="p-6">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {suggestion.case_id && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Case ID: </span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold">{suggestion.case_id}</span>
                              </div>
                            )}
                            {/* Public/Private Indicator */}
                            {(suggestion.isPublic || suggestion.is_public) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                🌐 Public
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                🔒 Private
                              </span>
                            )}
                          </div>
                          {suggestion.county && (
                            <div className="ml-auto">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">📍 </span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{suggestion.county}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                            {suggestion.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{suggestion.description}</p>
                        {suggestion.admin_note && (
                          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">Admin Note:</p>
                            <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2">{suggestion.admin_note}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {formatCategory(suggestion.category)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Rejected Suggestions Section */}
          {filteredAndSortedSuggestions.filter((s: Suggestion) => s.status === 'rejected').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">✗</span>
                Rejected Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedSuggestions
                  .filter((s: Suggestion) => s.status === 'rejected')
                  .map((suggestion: Suggestion) => (
                    <Link
                      key={suggestion.id}
                      to={`/suggestions/${suggestion.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
                    >
                      {suggestion.images && suggestion.images.length > 0 && (() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        const serverBaseUrl = apiBaseUrl.replace('/api', '');
                        const imageUrl = suggestion.images[0].startsWith('http') 
                          ? suggestion.images[0]
                          : `${serverBaseUrl}${suggestion.images[0]}`;
                        
                        return (
                          <img
                            src={imageUrl}
                            alt={suggestion.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        );
                      })()}
                      <div className="p-6">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {suggestion.case_id && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Case ID: </span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold">{suggestion.case_id}</span>
                              </div>
                            )}
                            {/* Public/Private Indicator */}
                            {(suggestion.isPublic || suggestion.is_public) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                🌐 Public
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                🔒 Private
                              </span>
                            )}
                          </div>
                          {suggestion.county && (
                            <div className="ml-auto">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">📍 </span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{suggestion.county}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                            {suggestion.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{suggestion.description}</p>
                        {suggestion.admin_note && (
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">Admin Note:</p>
                            <p className="text-xs text-red-700 dark:text-red-300 line-clamp-2">{suggestion.admin_note}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {formatCategory(suggestion.category)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Other Status Suggestions */}
          {filteredAndSortedSuggestions.filter((s: Suggestion) => s.status !== 'accepted' && s.status !== 'rejected').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Other Suggestions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedSuggestions
                  .filter((s: Suggestion) => s.status !== 'accepted' && s.status !== 'rejected')
                  .map((suggestion: Suggestion) => (
                    <Link
                      key={suggestion.id}
                      to={`/suggestions/${suggestion.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow block"
                    >
                      {suggestion.images && suggestion.images.length > 0 && (() => {
                        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                        const serverBaseUrl = apiBaseUrl.replace('/api', '');
                        const imageUrl = suggestion.images[0].startsWith('http') 
                          ? suggestion.images[0]
                          : `${serverBaseUrl}${suggestion.images[0]}`;
                        
                        return (
                          <img
                            src={imageUrl}
                            alt={suggestion.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        );
                      })()}
                      <div className="p-6">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {suggestion.case_id && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Case ID: </span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold">{suggestion.case_id}</span>
                              </div>
                            )}
                            {/* Public/Private Indicator */}
                            {(suggestion.isPublic || suggestion.is_public) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                🌐 Public
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                🔒 Private
                              </span>
                            )}
                          </div>
                          {suggestion.county && (
                            <div className="ml-auto">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">📍 </span>
                              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{suggestion.county}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                            {suggestion.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(suggestion.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{suggestion.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{suggestion.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {formatCategory(suggestion.category)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MySuggestions;
