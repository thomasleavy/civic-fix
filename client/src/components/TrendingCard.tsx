import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { appraisalService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TrendingCardProps {
  item: {
    id: string;
    title: string;
    description?: string;
    category: string;
    created_at: string;
    county?: string;
    appraisalCount?: number;
    itemType: 'issue' | 'suggestion';
  };
}

const TrendingCard = ({ item }: TrendingCardProps) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [appraisalCount, setAppraisalCount] = useState(item.appraisalCount || 0);

  const itemType = item.itemType || 'issue';
  const detailPath = itemType === 'issue' ? `/issues/${item.id}` : `/suggestions/${item.id}`;

  // Fetch initial appraisal status
  const { data: appraisalStatus } = useQuery({
    queryKey: ['appraisalStatus', item.id, itemType],
    queryFn: () => appraisalService.getStatus(item.id, itemType),
    enabled: isAuthenticated && !!item.id,
  });

  useEffect(() => {
    if (appraisalStatus) {
      setLiked(appraisalStatus.liked || false);
      setAppraisalCount(appraisalStatus.count || 0);
    } else if (item.appraisalCount !== undefined) {
      setAppraisalCount(item.appraisalCount);
    }
  }, [appraisalStatus, item.appraisalCount]);

  const toggleAppraisalMutation = useMutation({
    mutationFn: () => appraisalService.toggle(item.id, itemType),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['appraisalStatus', item.id, itemType] });
      const previousStatus = queryClient.getQueryData(['appraisalStatus', item.id, itemType]);
      const optimisticLiked = !liked;
      const optimisticCount = liked ? appraisalCount - 1 : appraisalCount + 1;
      setLiked(optimisticLiked);
      setAppraisalCount(optimisticCount);
      return { previousStatus };
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      setAppraisalCount(data.count);
      queryClient.setQueryData(['appraisalStatus', item.id, itemType], {
        liked: data.liked,
        count: data.count
      });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
      queryClient.invalidateQueries({ queryKey: ['civicSpace'] });
    },
    onError: (err, variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['appraisalStatus', item.id, itemType], context.previousStatus);
        setLiked(context.previousStatus.liked || false);
        setAppraisalCount(context.previousStatus.count || 0);
      }
    },
  });

  const handleAppraisalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleAppraisalMutation.mutate();
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 dark:from-orange-900/20 to-pink-50 dark:to-pink-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:shadow-md transition-shadow">
      <Link to={detailPath} className="block">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded">
                🔥 TRENDING
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                itemType === 'issue' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              }`}>
                {itemType === 'issue' ? '⚠️ Issue' : '💡 Suggestion'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            {item.county && (
              <span className="text-gray-600 dark:text-gray-400">📍 {item.county}</span>
            )}
            <span className="capitalize">{item.category?.replace('_', ' ')}</span>
          </div>
          <span>{format(new Date(item.created_at), 'MMM d')}</span>
        </div>
      </Link>
      {/* Like/Upvote Button */}
      <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800">
        <button
          onClick={handleAppraisalClick}
          disabled={!isAuthenticated || toggleAppraisalMutation.isPending}
          className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-all ${
            liked
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
          } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          title={isAuthenticated ? (liked ? 'Remove like' : 'Like this') : 'Sign in to like'}
        >
          <svg
            className="w-4 h-4"
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
      </div>
    </div>
  );
};

export default TrendingCard;
