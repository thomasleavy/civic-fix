import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { adminMessagesService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ContactFormData {
  issueType: string;
  description: string;
}

const ContactAdministrator = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [customIssueType, setCustomIssueType] = useState(false);

  const { data: issueTypesData, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['issueTypes'],
    queryFn: () => adminMessagesService.getIssueTypes(),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: (data: ContactFormData) => 
      adminMessagesService.createMessage(data.issueType, data.description),
    onSuccess: () => {
      toast.success('Message sent successfully! An administrator will review your request.');
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send message');
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ContactFormData>();
  const selectedIssueType = watch('issueType');

  useEffect(() => {
    if (selectedIssueType === 'Other') {
      setCustomIssueType(true);
      setValue('issueType', '');
    } else if (selectedIssueType) {
      setCustomIssueType(false);
    }
  }, [selectedIssueType, setValue]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
        <div className="text-center text-gray-600 dark:text-gray-300">
          Please log in to contact an administrator.
        </div>
      </div>
    );
  }

  const onSubmit = (data: ContactFormData) => {
    if (!data.issueType || !data.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Administrator</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Need to correct your profile information? Send a message to your assigned administrator. 
          They will review your request and update your details if needed.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Issue Type <span className="text-red-500">*</span>
            </label>
            {isLoadingTypes ? (
              <div className="text-gray-500 dark:text-gray-400">Loading issue types...</div>
            ) : (
              <div className="space-y-2">
                {issueTypesData?.issueTypes?.map((type: string) => (
                  <label
                    key={type}
                    className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                  >
                    <input
                      {...register('issueType', { required: 'Please select an issue type' })}
                      type="radio"
                      value={type}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.issueType && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.issueType.message}</p>
            )}
            {customIssueType && (
              <input
                {...register('issueType', { required: 'Please describe your issue' })}
                type="text"
                placeholder="Describe your issue..."
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', { 
                required: 'Description is required',
                minLength: {
                  value: 10,
                  message: 'Description must be at least 10 characters'
                }
              })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Please provide details about your request..."
            />
            {errors.description && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Provide as much detail as possible to help the administrator assist you.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactAdministrator;
