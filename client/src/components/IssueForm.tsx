import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { issueService } from '../services/api';

interface IssueFormProps {
  latitude: number;
  longitude: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  type: 'issue' | 'suggestion';
}

const issueCategories = [
  'pothole',
  'lighting',
  'litter',
  'fallen_wiring',
  'traffic_sign',
  'drainage',
  'other',
];

const suggestionCategories = [
  'cycling_infrastructure',
  'parks_greenspaces',
  'public_transport',
  'pedestrian_safety',
  'community_facilities',
  'environmental',
  'accessibility',
  'other',
];

const IssueForm = ({ latitude, longitude, onSuccess, onCancel }: IssueFormProps) => {
  const [images, setImages] = useState<File[]>([]);
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: { type: 'issue' }
  });
  
  const selectedType = watch('type') || 'issue';
  const categories = selectedType === 'suggestion' ? suggestionCategories : issueCategories;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('type', data.type || 'issue');
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      images.forEach((image) => {
        formData.append('images', image);
      });

      return issueService.create(formData);
    },
    onSuccess: (_, variables) => {
      const message = variables.type === 'suggestion' 
        ? 'Suggestion submitted successfully!'
        : 'Issue reported successfully!';
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Append new files to existing images, up to 5 total
      const totalImages = images.length + newFiles.length;
      if (totalImages <= 5) {
        setImages([...images, ...newFiles]);
      } else {
        // If adding these files would exceed 5, only add enough to reach 5
        const remainingSlots = 5 - images.length;
        setImages([...images, ...newFiles.slice(0, remainingSlots)]);
      }
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Report Issue or Suggest Improvement</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type *
        </label>
        <div className="flex space-x-4 mb-4">
          <label className="flex items-center text-gray-700 dark:text-gray-300">
            <input
              {...register('type', { required: true })}
              type="radio"
              value="issue"
              className="mr-2"
            />
            <span>Report an Issue</span>
          </label>
          <label className="flex items-center text-gray-700 dark:text-gray-300">
            <input
              {...register('type', { required: true })}
              type="radio"
              value="suggestion"
              className="mr-2"
            />
            <span>Suggest Improvement</span>
          </label>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {selectedType === 'issue' 
            ? 'Report problems like potholes, broken lights, or fallen wiring.'
            : 'Share ideas for improving your community (e.g., better cycling paths, new parks).'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title *
        </label>
        <input
          {...register('title', { required: 'Title is required' })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category *
        </label>
        <select
          {...register('category', { required: 'Category is required' })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Photos (up to 5 images)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {images.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {images.length} of 5 images selected
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 sm:h-28 object-cover rounded border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md"
                    title="Remove image"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default IssueForm;
