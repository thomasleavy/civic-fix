import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { appraisalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    description?: string;
    category: string;
    status: string;
    type?: string;
    created_at: string;
    images?: string[];
    case_id?: string;
    county?: string;
    appraisalCount?: number;
    isPublic?: boolean;
    is_public?: boolean; // Backend may return snake_case
    isTrending?: boolean;
    admin_note?: string;
    admin_action_at?: string;
    admin_action_email?: string;
  };
  showAppraisal?: boolean; // Only show appraisal button for public items in civic space
}

const statusColors: Record<string, string> = {
  reported: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const IssueCard = ({ issue, showAppraisal = false }: IssueCardProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [appraisalCount, setAppraisalCount] = useState(issue.appraisalCount || 0);

  // Fetch initial liked status and count
  const { data: appraisalStatus } = useQuery({
    queryKey: ['appraisalStatus', issue.id, 'issue'],
    queryFn: () => appraisalService.getStatus(issue.id, 'issue'),
    enabled: showAppraisal,
  });

  const toggleAppraisalMutation = useMutation({
    mutationFn: () => appraisalService.toggle(issue.id, 'issue'),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appraisalStatus', issue.id, 'issue'] });
      
      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData(['appraisalStatus', issue.id, 'issue']);
      
      // Optimistically update to the expected value
      const optimisticLiked = !liked;
      const optimisticCount = liked ? appraisalCount - 1 : appraisalCount + 1;
      
      setLiked(optimisticLiked);
      setAppraisalCount(optimisticCount);
      
      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onSuccess: (data) => {
      // Update with actual server response
      setLiked(data.liked);
      setAppraisalCount(data.count);
      // Update the query cache
      queryClient.setQueryData(['appraisalStatus', issue.id, 'issue'], {
        liked: data.liked,
        count: data.count
      });
      // Invalidate civic space query to refresh counts
      queryClient.invalidateQueries({ queryKey: ['civicSpace'] });
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(['appraisalStatus', issue.id, 'issue'], context.previousStatus);
        setLiked(context.previousStatus.liked || false);
        setAppraisalCount(context.previousStatus.count || 0);
      }
    },
  });

  const isPending = toggleAppraisalMutation.isPending;

  useEffect(() => {
    // Only update from query if we're not currently in a mutation
    if (appraisalStatus && !isPending) {
      setLiked(appraisalStatus.liked || false);
      setAppraisalCount(appraisalStatus.count || 0);
    } else if (!appraisalStatus && issue.appraisalCount !== undefined && !isPending) {
      // Fallback to count from issue data if status not yet loaded
      setAppraisalCount(issue.appraisalCount);
    }
  }, [appraisalStatus, issue.appraisalCount, isPending]);

  const handleAppraisalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated && showAppraisal) {
      toggleAppraisalMutation.mutate();
    }
  };

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden block relative"
    >
      {/* Trending Banner */}
      {issue.isTrending && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-center py-2 px-4 z-10">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 0112 18v-5H8a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-sm uppercase tracking-wide">🔥 Trending</span>
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 0112 18v-5H8a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      {issue.images && issue.images.length > 0 && (() => {
        // Construct proper image URL - handle both relative and absolute URLs
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverBaseUrl = apiBaseUrl.replace('/api', '');
        const imageUrl = issue.images[0].startsWith('http') 
          ? issue.images[0] 
          : `${serverBaseUrl}${issue.images[0].startsWith('/') ? issue.images[0] : '/' + issue.images[0]}`;
        
        return (
          <img
            src={imageUrl}
            alt={issue.title}
            className="w-full h-48 object-cover"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl, 'Original:', issue.images[0]);
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', imageUrl);
            }}
          />
        );
      })()}
      <div className={`p-6 ${issue.isTrending ? 'pt-8' : ''}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {issue.case_id && (
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Case ID: </span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{issue.case_id}</span>
              </div>
            )}
            {/* Public/Private Indicator */}
            {(issue.isPublic || issue.is_public) ? (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                🌐 Public
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                🔒 Private
              </span>
            )}
          </div>
          {issue.county && (
            <div className="ml-auto">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">📍 </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{issue.county}</span>
            </div>
          )}
        </div>
        <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">{issue.title}</h3>
        {issue.type && (
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
            issue.type === 'suggestion' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {issue.type === 'suggestion' ? '💡 Suggestion' : '⚠️ Issue'}
          </span>
        )}
      </div>
      {issue.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{issue.description}</p>
      )}
      {issue.admin_note && (issue.status === 'accepted' || issue.status === 'rejected') && (
        <div className={`mb-3 p-3 rounded-lg border ${
          issue.status === 'accepted'
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        }`}>
          <p className={`text-xs font-semibold mb-1 ${
            issue.status === 'accepted'
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {issue.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'} - Admin Note:
          </p>
          <p className={`text-xs line-clamp-2 ${
            issue.status === 'accepted'
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {issue.admin_note}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[issue.status] || statusColors.under_review}`}>
            {issue.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {issue.category?.replace('_', ' ')}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(issue.created_at), 'MMM d, yyyy')}
        </span>
      </div>
      
      {/* Appraisal Button - Only show for public items in civic space */}
      {showAppraisal && (
        <button
          onClick={handleAppraisalClick}
          disabled={!isAuthenticated || isPending}
          className={`absolute bottom-4 right-4 flex items-center space-x-1 px-3 py-2 rounded-full shadow-md transition-all ${
            liked
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
          } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isAuthenticated ? (liked ? 'Remove like' : 'Like this issue') : 'Sign in to like'}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium">{appraisalCount}</span>
        </button>
      )}
    </div>
    </Link>
  );
};

export default IssueCard;
