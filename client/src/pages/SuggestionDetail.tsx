import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { suggestionService, appraisalService, adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ExportButtons from '../components/ExportButtons';
import { CaseData } from '../utils/exportUtils';
import ImageCarousel from '../components/ImageCarousel';
import toast from 'react-hot-toast';

const SuggestionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [appraisalCount, setAppraisalCount] = useState(0);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ status: string } | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suggestion', id],
    queryFn: () => suggestionService.getById(id!),
  });

  const suggestion = data?.suggestion;
  const isPublic = suggestion?.is_public;
  
  // Check if admin can manage this suggestion
  const { data: adminLocations } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.getAdminLocations(),
    enabled: isAdmin && isAuthenticated,
  });
  
  const canManage = isAdmin && suggestion?.county && adminLocations?.locations?.includes(suggestion.county);

  // Fetch initial appraisal status
  const { data: appraisalStatus } = useQuery({
    queryKey: ['appraisalStatus', id, 'suggestion'],
    queryFn: () => appraisalService.getStatus(id!, 'suggestion'),
    enabled: !!id,
  });

  useEffect(() => {
    if (appraisalStatus) {
      setLiked(appraisalStatus.liked || false);
      setAppraisalCount(appraisalStatus.count || 0);
    }
  }, [appraisalStatus]);

  const toggleAppraisalMutation = useMutation({
    mutationFn: () => appraisalService.toggle(id!, 'suggestion'),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['appraisalStatus', id, 'suggestion'] });
      const previousStatus = queryClient.getQueryData(['appraisalStatus', id, 'suggestion']);
      const optimisticLiked = !liked;
      const optimisticCount = liked ? appraisalCount - 1 : appraisalCount + 1;
      setLiked(optimisticLiked);
      setAppraisalCount(optimisticCount);
      return { previousStatus };
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      setAppraisalCount(data.count);
      queryClient.setQueryData(['appraisalStatus', id, 'suggestion'], {
        liked: data.liked,
        count: data.count
      });
      queryClient.invalidateQueries({ queryKey: ['trending'] });
      queryClient.invalidateQueries({ queryKey: ['civicSpace'] });
    },
    onError: (err, variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['appraisalStatus', id, 'suggestion'], context.previousStatus);
        setLiked(context.previousStatus.liked || false);
        setAppraisalCount(context.previousStatus.count || 0);
      }
    },
  });

  const isPending = toggleAppraisalMutation.isPending;

  const handleAppraisalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated && isPublic) {
      toggleAppraisalMutation.mutate();
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, adminNote }: { status: string; adminNote?: string }) =>
      adminService.updateSuggestionStatus(id!, status, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestion', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'suggestions'] });
      toast.success('Suggestion status updated successfully');
      setShowNoteModal(false);
      setPendingAction(null);
      setAdminNote('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update suggestion status');
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setPendingAction({ status: newStatus });
      setShowNoteModal(true);
      setAdminNote('');
    } else {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const handleSubmitNote = () => {
    if (!adminNote.trim()) {
      toast.error('Please provide an admin note');
      return;
    }
    if (!pendingAction) return;
    updateStatusMutation.mutate({ status: pendingAction.status, adminNote: adminNote.trim() });
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!data?.suggestion) {
    return <div className="text-center py-12">Suggestion not found</div>;
  }

  // Prepare case data for export
  const caseData: CaseData = {
    caseId: suggestion.case_id || 'N/A',
    title: suggestion.title,
    description: suggestion.description || 'No description provided.',
    status: suggestion.status,
    category: suggestion.category,
    createdAt: suggestion.created_at,
    updatedAt: suggestion.updated_at,
    type: 'suggestion',
    images: suggestion.images || [],
  };

  const formatCategory = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ExportButtons caseData={caseData} />
      {canManage && suggestion.status === 'under_review' && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Admin Actions</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleStatusChange('accepted')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Accept
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            >
              Reject
            </button>
          </div>
        </div>
      )}
      {canManage && suggestion.status === 'accepted' && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Admin Actions</h3>
          <button
            onClick={() => handleStatusChange('in_progress')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Mark In Progress
          </button>
        </div>
      )}
      {canManage && suggestion.status === 'in_progress' && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">Admin Actions</h3>
          <button
            onClick={() => handleStatusChange('resolved')}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
          >
            Mark Resolved
          </button>
        </div>
      )}
      <div id="print-content" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 print:shadow-none print:border print:border-gray-300">
        <div className="flex items-center justify-between mb-4 print:flex-col print:items-start print:gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white print:text-2xl">{suggestion.title}</h1>
          <div className="flex items-center space-x-3">
            {suggestion.case_id && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 print:bg-white print:border-gray-400">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium print:text-gray-700">Case ID:</span>
                <span className="text-sm text-green-900 dark:text-green-200 font-bold ml-2 print:text-gray-900">{suggestion.case_id}</span>
              </div>
            )}
            {/* Like/Upvote Button - Only show for public suggestions */}
            {isPublic && (
              <button
                onClick={handleAppraisalClick}
                disabled={!isAuthenticated || isPending}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all print:hidden ${
                  liked
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={isAuthenticated ? (liked ? 'Remove like' : 'Like this suggestion') : 'Sign in to like'}
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
        </div>
        
        {suggestion.images && suggestion.images.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Attached Images</h2>
            <ImageCarousel images={suggestion.images} alt={suggestion.title} />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 text-sm">No images attached to this suggestion.</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{suggestion.description || 'No description provided.'}</p>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {suggestion.case_id && (
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Case ID:</span>
                <p className="text-green-600 font-bold">{suggestion.case_id}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <p className={`text-gray-600 capitalize inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
                {suggestion.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
              <p className="text-gray-600">{formatCategory(suggestion.category)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <p className="text-gray-600">{format(new Date(suggestion.created_at), 'MMM d, yyyy')}</p>
            </div>
            {suggestion.county && (
              <div>
                <span className="font-medium text-gray-700">County:</span>
                <p className="text-gray-600 font-semibold">📍 {suggestion.county}</p>
                <p className="text-xs text-gray-500 mt-1">Registered to this county at time of submission</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Last Updated:</span>
              <p className="text-gray-600 dark:text-gray-400">{format(new Date(suggestion.updated_at), 'MMM d, yyyy')}</p>
            </div>
            {suggestion.admin_note && (
              <div className="col-span-2 md:col-span-4">
                <div className={`p-4 rounded-lg border mt-4 ${
                  suggestion.status === 'accepted' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : suggestion.status === 'rejected'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {suggestion.status === 'accepted' ? '✓ Accepted' : suggestion.status === 'rejected' ? '✗ Rejected' : 'Admin Note'}
                    </h3>
                    {suggestion.admin_action_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(suggestion.admin_action_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{suggestion.admin_note}</p>
                  {suggestion.admin_action_email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      By: {suggestion.admin_action_email}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Note Modal */}
      {showNoteModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {pendingAction.status === 'accepted' ? 'Accept' : 'Reject'} Suggestion
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
                disabled={!adminNote.trim() || updateStatusMutation.isPending}
                className={`px-4 py-2 rounded-md text-white ${
                  pendingAction.status === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updateStatusMutation.isPending ? 'Processing...' : pendingAction.status === 'accepted' ? 'Accept' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionDetail;
