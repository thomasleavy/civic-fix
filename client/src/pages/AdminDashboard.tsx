import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { adminService, profileService, trendingService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import TrendingCard from '../components/TrendingCard';
import WeatherDisplay from '../components/WeatherDisplay';
import LocalNews from '../components/LocalNews';

const AdminDashboard = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'issues' | 'suggestions'>('issues');
  const [caseIdFilter, setCaseIdFilter] = useState<string>('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    type: 'issue' | 'suggestion';
    status: string;
  } | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  
  // Status filter state (to_examine, accepted, rejected)
  const [issuesStatusFilter, setIssuesStatusFilter] = useState<'to_examine' | 'accepted' | 'rejected'>('to_examine');
  const [suggestionsStatusFilter, setSuggestionsStatusFilter] = useState<'to_examine' | 'accepted' | 'rejected'>('to_examine');
  
  // Pagination state for each section
  const [issuesPage, setIssuesPage] = useState(1);
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;

  // Fetch profile for county and user info
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  const hasCounty = profileData?.profile?.county;

  // Check if admin has locations set
  const { data: locationsData } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.getAdminLocations(),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch trending items from all locations (not county-specific)
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => trendingService.getAll(),
    enabled: isAuthenticated,
  });

  // Note: Unread message count is now handled in the Navbar component

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
    } else if (isAuthenticated && !isAdmin) {
      // Regular users should not access admin dashboard, redirect to regular dashboard
      navigate('/dashboard', { replace: true });
    } else if (isAuthenticated && isAdmin && locationsData && locationsData.locations.length === 0) {
      // Admin has no locations set, redirect to admin profile
      navigate('/admin-profile');
    }
  }, [isAuthenticated, isAdmin, locationsData, navigate]);

  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['admin', 'issues', caseIdFilter],
    queryFn: () => adminService.getIssuesForAdmin(caseIdFilter || undefined),
    enabled: isAuthenticated && isAdmin && locationsData && locationsData.locations.length > 0,
  });

  const { data: suggestionsData, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['admin', 'suggestions', caseIdFilter],
    queryFn: () => adminService.getSuggestionsForAdmin(caseIdFilter || undefined),
    enabled: isAuthenticated && isAdmin && locationsData && locationsData.locations.length > 0,
  });

  const updateIssueStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      adminService.updateIssueStatus(id, status, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
      toast.success('Issue status updated successfully');
      setShowNoteModal(false);
      setPendingAction(null);
      setAdminNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update issue status');
    },
  });

  const updateSuggestionStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      adminService.updateSuggestionStatus(id, status, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      toast.success('Suggestion status updated successfully');
      setShowNoteModal(false);
      setPendingAction(null);
      setAdminNote('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update suggestion status');
    },
  });

  // Reset pagination when switching tabs or status filters
  // This hook MUST be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    setIssuesPage(1);
    setSuggestionsPage(1);
  }, [activeTab, issuesStatusFilter, suggestionsStatusFilter]);

  // Early returns must come AFTER all hooks
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (locationsData && locationsData.locations.length === 0) {
    return null; // Will redirect via useEffect
  }

  const allIssues = issuesData?.issues || [];
  const allSuggestions = suggestionsData?.suggestions || [];
  
  // Filter issues by status
  const issuesToExamine = allIssues.filter((issue: any) => issue.status === 'under_review');
  const acceptedIssues = allIssues.filter((issue: any) => issue.status === 'accepted');
  const rejectedIssues = allIssues.filter((issue: any) => issue.status === 'rejected');
  
  // Filter suggestions by status
  const suggestionsToExamine = allSuggestions.filter((suggestion: any) => suggestion.status === 'under_review');
  const acceptedSuggestions = allSuggestions.filter((suggestion: any) => suggestion.status === 'accepted');
  const rejectedSuggestions = allSuggestions.filter((suggestion: any) => suggestion.status === 'rejected');
  
  // Get filtered issues based on status filter
  const getFilteredIssues = () => {
    switch (issuesStatusFilter) {
      case 'accepted':
        return acceptedIssues;
      case 'rejected':
        return rejectedIssues;
      default:
        return issuesToExamine;
    }
  };
  
  // Get filtered suggestions based on status filter
  const getFilteredSuggestions = () => {
    switch (suggestionsStatusFilter) {
      case 'accepted':
        return acceptedSuggestions;
      case 'rejected':
        return rejectedSuggestions;
      default:
        return suggestionsToExamine;
    }
  };
  
  // Pagination helper function
  const paginate = <T,>(items: T[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedItems: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / itemsPerPage),
      currentPage: page,
      totalItems: items.length
    };
  };
  
  // Paginated data for issues
  const filteredIssues = getFilteredIssues();
  const issuesPaginated = paginate(filteredIssues, issuesPage, ITEMS_PER_PAGE);
  
  // Paginated data for suggestions
  const filteredSuggestions = getFilteredSuggestions();
  const suggestionsPaginated = paginate(filteredSuggestions, suggestionsPage, ITEMS_PER_PAGE);

  const handleStatusChange = (id: string, type: 'issue' | 'suggestion', newStatus: string) => {
    // If accepting or rejecting, require admin note
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setPendingAction({ id, type, status: newStatus });
      setShowNoteModal(true);
      setAdminNote('');
    } else {
      // For other status changes, proceed without note
      if (type === 'issue') {
        updateIssueStatusMutation.mutate({ id, status: newStatus });
      } else {
        updateSuggestionStatusMutation.mutate({ id, status: newStatus });
      }
    }
  };

  const handleSubmitNote = () => {
    if (!adminNote.trim()) {
      toast.error('Please provide an admin note');
      return;
    }

    if (!pendingAction) return;

    if (pendingAction.type === 'issue') {
      updateIssueStatusMutation.mutate({
        id: pendingAction.id,
        status: pendingAction.status,
        adminNote: adminNote.trim()
      });
    } else {
      updateSuggestionStatusMutation.mutate({
        id: pendingAction.id,
        status: pendingAction.status,
        adminNote: adminNote.trim()
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
            {locationsData && locationsData.locations.length > 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                Managing counties: <strong>{locationsData.locations.join(', ')}</strong>
              </p>
            )}
          </div>
        </div>
        {hasCounty && (
          <div className="flex items-center space-x-3 mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your submissions will be registered to: <strong className="text-gray-700 dark:text-gray-300">📍 {profileData.profile.county}</strong>
            </p>
            <WeatherDisplay county={profileData.profile.county} />
          </div>
        )}
      </div>

      {/* Admin Management Section - MOVED TO TOP */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Admin Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage issues and suggestions from your assigned counties
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Issues ({issuesToExamine.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Suggestions ({suggestionsToExamine.length})
          </button>
        </nav>
      </div>

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Issues for Your Counties</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage all issues (public and private) from your assigned counties
                </p>
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
                  <select
                    value={issuesStatusFilter}
                    onChange={(e) => {
                      setIssuesStatusFilter(e.target.value as 'to_examine' | 'accepted' | 'rejected');
                      setIssuesPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="to_examine">To Examine ({issuesToExamine.length})</option>
                    <option value="accepted">Accepted ({acceptedIssues.length})</option>
                    <option value="rejected">Rejected ({rejectedIssues.length})</option>
                  </select>
                </div>
                
                {/* Case ID Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Case ID:</label>
                  <input
                    type="text"
                    placeholder="Filter by Case ID..."
                    value={caseIdFilter}
                    onChange={(e) => setCaseIdFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  {caseIdFilter && (
                    <button
                      onClick={() => setCaseIdFilter('')}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {issuesLoading ? (
            <div className="p-6 text-center text-gray-900 dark:text-white">Loading issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {issuesStatusFilter === 'to_examine' && 'No issues to examine'}
              {issuesStatusFilter === 'accepted' && 'No accepted issues'}
              {issuesStatusFilter === 'rejected' && 'No rejected issues'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">County</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                      {issuesStatusFilter === 'rejected' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Admin Note</th>
                      )}
                      {(issuesStatusFilter === 'to_examine' || issuesStatusFilter === 'accepted') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {issuesPaginated.paginatedItems.map((issue: any) => (
                      <tr 
                        key={issue.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          navigate(`/issues/${issue.id}`);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                              {issue.case_id}
                            </span>
                            {/* Public/Private Indicator */}
                            {(issue.is_public || issue.isPublic) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                🌐 Public
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                🔒 Private
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{issue.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{issue.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {issue.county}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {issue.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </td>
                        {issuesStatusFilter === 'rejected' && (
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {issue.admin_note ? (
                              <span className="truncate max-w-xs block" title={issue.admin_note}>
                                {issue.admin_note}
                              </span>
                            ) : (
                              <span className="text-gray-400">No note</span>
                            )}
                          </td>
                        )}
                        {issuesStatusFilter === 'to_examine' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStatusChange(issue.id, 'issue', 'accepted')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(issue.id, 'issue', 'rejected')}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        )}
                        {issuesStatusFilter === 'accepted' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStatusChange(issue.id, 'issue', 'in_progress')}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Mark In Progress
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {issuesPaginated.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((issuesPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(issuesPage * ITEMS_PER_PAGE, issuesPaginated.totalItems)} of {issuesPaginated.totalItems} issues
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIssuesPage(p => Math.max(1, p - 1))}
                      disabled={issuesPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Page {issuesPage} of {issuesPaginated.totalPages}
                    </span>
                    <button
                      onClick={() => setIssuesPage(p => Math.min(issuesPaginated.totalPages, p + 1))}
                      disabled={issuesPage === issuesPaginated.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suggestions for Your Counties</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage all suggestions (public and private) from your assigned counties
                </p>
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</label>
                  <select
                    value={suggestionsStatusFilter}
                    onChange={(e) => {
                      setSuggestionsStatusFilter(e.target.value as 'to_examine' | 'accepted' | 'rejected');
                      setSuggestionsPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="to_examine">To Examine ({suggestionsToExamine.length})</option>
                    <option value="accepted">Accepted ({acceptedSuggestions.length})</option>
                    <option value="rejected">Rejected ({rejectedSuggestions.length})</option>
                  </select>
                </div>
                
                {/* Case ID Filter */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Case ID:</label>
                  <input
                    type="text"
                    placeholder="Filter by Case ID..."
                    value={caseIdFilter}
                    onChange={(e) => setCaseIdFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                  {caseIdFilter && (
                    <button
                      onClick={() => setCaseIdFilter('')}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {suggestionsLoading ? (
            <div className="p-6 text-center text-gray-900 dark:text-white">Loading suggestions...</div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              {suggestionsStatusFilter === 'to_examine' && 'No suggestions to examine'}
              {suggestionsStatusFilter === 'accepted' && 'No accepted suggestions'}
              {suggestionsStatusFilter === 'rejected' && 'No rejected suggestions'}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Case ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">County</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                      {suggestionsStatusFilter === 'rejected' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Admin Note</th>
                      )}
                      {(suggestionsStatusFilter === 'to_examine' || suggestionsStatusFilter === 'accepted') && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {suggestionsPaginated.paginatedItems.map((suggestion: any) => (
                      <tr 
                        key={suggestion.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest('button')) return;
                          navigate(`/suggestions/${suggestion.id}`);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                              {suggestion.case_id}
                            </span>
                            {/* Public/Private Indicator */}
                            {(suggestion.is_public || suggestion.isPublic) ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                🌐 Public
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                🔒 Private
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{suggestion.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{suggestion.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {suggestion.county}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {suggestion.category?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(suggestion.created_at).toLocaleDateString()}
                        </td>
                        {suggestionsStatusFilter === 'rejected' && (
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {suggestion.admin_note ? (
                              <span className="truncate max-w-xs block" title={suggestion.admin_note}>
                                {suggestion.admin_note}
                              </span>
                            ) : (
                              <span className="text-gray-400">No note</span>
                            )}
                          </td>
                        )}
                        {suggestionsStatusFilter === 'to_examine' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'suggestion', 'accepted')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'suggestion', 'rejected')}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        )}
                        {suggestionsStatusFilter === 'accepted' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleStatusChange(suggestion.id, 'suggestion', 'in_progress')}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Mark In Progress
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {suggestionsPaginated.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((suggestionsPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(suggestionsPage * ITEMS_PER_PAGE, suggestionsPaginated.totalItems)} of {suggestionsPaginated.totalItems} suggestions
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSuggestionsPage(p => Math.max(1, p - 1))}
                      disabled={suggestionsPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Page {suggestionsPage} of {suggestionsPaginated.totalPages}
                    </span>
                    <button
                      onClick={() => setSuggestionsPage(p => Math.min(suggestionsPaginated.totalPages, p + 1))}
                      disabled={suggestionsPage === suggestionsPaginated.totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
        <div className="mb-8">
          <LocalNews county={profileData.profile.county} />
        </div>
      )}

      {/* Admin Note Modal */}
      {showNoteModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {pendingAction.status === 'accepted' ? 'Accept' : 'Reject'} {pendingAction.type === 'issue' ? 'Issue' : 'Suggestion'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a note explaining your decision. This note will be visible to the user.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Note <span className="text-red-500">*</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your note here..."
                required
              />
            </div>
            <div className="flex space-x-4 justify-end">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setPendingAction(null);
                  setAdminNote('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNote}
                disabled={!adminNote.trim() || updateIssueStatusMutation.isPending || updateSuggestionStatusMutation.isPending}
                className={`px-4 py-2 rounded-md text-white ${
                  pendingAction.status === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updateIssueStatusMutation.isPending || updateSuggestionStatusMutation.isPending
                  ? 'Processing...'
                  : pendingAction.status === 'accepted'
                  ? 'Accept'
                  : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
