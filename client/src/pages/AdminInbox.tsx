import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { adminMessagesService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  user_id: string;
  admin_id: string;
  issue_type: string;
  description: string;
  status: string;
  admin_response: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  user_email: string;
  first_name: string | null;
  surname: string | null;
  user_county: string | null;
}

interface UserProfile {
  first_name?: string;
  surname?: string;
  date_of_birth?: string;
  ppsn?: string;
  address?: string;
}

const AdminInbox = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile>({});

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['adminMessages', filterStatus],
    queryFn: () => adminMessagesService.getAdminMessages(filterStatus === 'all' ? undefined : filterStatus),
    enabled: isAuthenticated && isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ messageId, status, adminResponse }: { messageId: string; status: string; adminResponse?: string }) =>
      adminMessagesService.updateMessageStatus(messageId, status, adminResponse),
    onSuccess: () => {
      toast.success('Message status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update message status');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, profileData }: { userId: string; profileData: UserProfile }) =>
      adminMessagesService.updateUserProfileByAdmin(userId, profileData),
    onSuccess: () => {
      toast.success('User profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowEditModal(false);
      setEditFormData({});
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update user profile');
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => adminMessagesService.deleteMessage(messageId),
    onSuccess: () => {
      toast.success('Message deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      setSelectedMessage(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete message');
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const messages: Message[] = messagesData?.messages || [];

  const handleStatusChange = (messageId: string, status: string, adminResponse?: string) => {
    updateStatusMutation.mutate({ messageId, status, adminResponse });
  };

  const handleEditProfile = async (message: Message) => {
    setSelectedMessage(message);
    setShowEditModal(true);
    
    // Fetch user's current profile data
    try {
      const profileData = await adminMessagesService.getUserProfileByAdmin(message.user_id);
      if (profileData?.profile) {
        const profile = profileData.profile;
        setEditFormData({
          first_name: profile.first_name || '',
          surname: profile.surname || '',
          date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '', // Format date for input
          ppsn: profile.ppsn || '',
          address: profile.address || '',
        });
      } else {
        setEditFormData({});
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setEditFormData({});
    }
  };

  const handleSaveProfile = () => {
    if (!selectedMessage) return;
    // Convert form data from snake_case to camelCase for API
    updateProfileMutation.mutate({
      userId: selectedMessage.user_id,
      profileData: {
        firstName: editFormData.first_name,
        surname: editFormData.surname,
        dateOfBirth: editFormData.date_of_birth,
        ppsn: editFormData.ppsn,
        address: editFormData.address,
      }
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Inbox</h1>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Messages</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="text-center text-gray-600 dark:text-gray-300">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No messages found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow relative"
            >
              <div 
                className="flex-1 cursor-pointer pr-10"
                onClick={async () => {
                  setSelectedMessage(message);
                  // Mark message as viewed when clicked (if not already viewed)
                  if (!message.viewed_at) {
                    try {
                      await adminMessagesService.markMessageAsViewed(message.id);
                      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
                    } catch (error) {
                      console.error('Failed to mark message as viewed:', error);
                    }
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(message.status)}`}>
                        {message.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.first_name || 'User'} {message.surname || ''}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({message.user_email})
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {message.issue_type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {message.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>County: {message.user_county || 'Not set'}</span>
                      <span>•</span>
                      <span>{format(new Date(message.created_at), 'PPpp')}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
                    deleteMessageMutation.mutate(message.id);
                  }
                }}
                disabled={deleteMessageMutation.isPending}
                className="absolute top-4 right-4 p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                title="Delete message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Message Details</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedMessage.first_name || 'N/A'} {selectedMessage.surname || ''} ({selectedMessage.user_email})
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">County: {selectedMessage.user_county || 'Not set'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Type</label>
                <p className="text-gray-900 dark:text-white">{selectedMessage.issue_type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedMessage.status)}`}>
                  {selectedMessage.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {selectedMessage.admin_response && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Response</label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                </div>
              )}

              <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedMessage.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'in_progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => handleEditProfile(selectedMessage)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Edit User Profile
                    </button>
                  </>
                )}
                {selectedMessage.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'resolved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleEditProfile(selectedMessage)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Edit User Profile
                    </button>
                  </>
                )}
                {selectedMessage.status === 'resolved' && (
                  <button
                    onClick={() => handleStatusChange(selectedMessage.id, 'closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
                      deleteMessageMutation.mutate(selectedMessage.id);
                      setSelectedMessage(null);
                    }
                  }}
                  disabled={deleteMessageMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>{deleteMessageMutation.isPending ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Profile for {selectedMessage.first_name || 'User'} {selectedMessage.surname || ''}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={editFormData.first_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Surname</label>
                <input
                  type="text"
                  value={editFormData.surname || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, surname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter surname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editFormData.date_of_birth || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PPSN</label>
                <input
                  type="text"
                  value={editFormData.ppsn || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, ppsn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter PPSN"
                  maxLength={9}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter address"
                />
              </div>

              <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditFormData({});
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInbox;
