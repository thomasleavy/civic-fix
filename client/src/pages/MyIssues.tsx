import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { issueService } from '../services/api';
import { Link } from 'react-router-dom';
import IssueCard from '../components/IssueCard';

const MyIssues = () => {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['myIssues'],
    queryFn: () => issueService.getMyIssues(),
    enabled: isAuthenticated,
  });

  // Get unique categories and statuses for filter dropdowns
  const categories = useMemo(() => {
    if (!data?.issues) return [];
    const uniqueCategories = new Set(data.issues.map((issue: any) => issue.category));
    return Array.from(uniqueCategories).sort();
  }, [data?.issues]);

  const statuses = useMemo(() => {
    if (!data?.issues) return [];
    const uniqueStatuses = new Set(data.issues.map((issue: any) => issue.status));
    return Array.from(uniqueStatuses).sort();
  }, [data?.issues]);

  // Filter and sort issues
  const filteredAndSortedIssues = useMemo(() => {
    if (!data?.issues) return [];

    let filtered = [...data.issues];

    // Search filter (case ID, title, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((issue: any) => {
        const caseId = issue.case_id?.toLowerCase() || '';
        const title = issue.title?.toLowerCase() || '';
        const description = issue.description?.toLowerCase() || '';
        return caseId.includes(query) || title.includes(query) || description.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue: any) => issue.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((issue: any) => issue.category === categoryFilter);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((issue: any) => {
        const issueDate = new Date(issue.created_at);
        return issueDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire end date
      filtered = filtered.filter((issue: any) => {
        const issueDate = new Date(issue.created_at);
        return issueDate <= toDate;
      });
    }

    // Sort
    filtered.sort((a: any, b: any) => {
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
  }, [data?.issues, searchQuery, statusFilter, categoryFilter, sortBy, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('date_desc');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo;

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please log in to view your issues</h1>
          <Link to="/civicfix?tab=login" className="text-primary-600 dark:text-primary-400 hover:underline">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">My Reported Issues & Suggestions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          View all the issues you've reported and suggestions you've submitted.
        </p>
      </div>

      {/* Search and Filter Section */}
      {!isLoading && data?.issues && data.issues.length > 0 && (
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
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                Showing {filteredAndSortedIssues.length} of {data.issues.length} issues
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">Loading your issues...</div>
      ) : data?.issues?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">You haven't reported any issues or submitted any suggestions yet.</p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Report an Issue or Submit a Suggestion
          </Link>
        </div>
      ) : filteredAndSortedIssues.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">No issues match your search criteria.</p>
          <button
            onClick={clearFilters}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Accepted Issues Section */}
          {filteredAndSortedIssues.filter((issue: any) => issue.status === 'accepted').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                Accepted Issues
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedIssues
                  .filter((issue: any) => issue.status === 'accepted')
                  .map((issue: any) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
              </div>
            </div>
          )}

          {/* Rejected Issues Section */}
          {filteredAndSortedIssues.filter((issue: any) => issue.status === 'rejected').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">✗</span>
                Rejected Issues
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedIssues
                  .filter((issue: any) => issue.status === 'rejected')
                  .map((issue: any) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
              </div>
            </div>
          )}

          {/* Other Status Issues */}
          {filteredAndSortedIssues.filter((issue: any) => issue.status !== 'accepted' && issue.status !== 'rejected').length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Other Issues</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedIssues
                  .filter((issue: any) => issue.status !== 'accepted' && issue.status !== 'rejected')
                  .map((issue: any) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyIssues;
