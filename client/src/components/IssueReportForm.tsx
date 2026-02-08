import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { issueService, suggestionService } from '../services/api';

interface IssueReportFormProps {
  type: 'issue' | 'suggestion';
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  otherDetails?: string;
  isPublic: boolean;
}

const issueCategories = [
  { value: 'roads_transportation', label: 'Roads & Transportation' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'environment_waste', label: 'Environment & Waste Management' },
  { value: 'infrastructure', label: 'Infrastructure & Utilities' },
  { value: 'public_spaces', label: 'Public Spaces & Amenities' },
  { value: 'traffic_management', label: 'Traffic Management' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'other', label: 'Other' },
];

const suggestionCategories = [
  { value: 'transportation_mobility', label: 'Transportation & Mobility' },
  { value: 'parks_recreation', label: 'Parks & Recreation' },
  { value: 'community_development', label: 'Community Development' },
  { value: 'environmental_sustainability', label: 'Environmental Sustainability' },
  { value: 'public_services', label: 'Public Services & Facilities' },
  { value: 'urban_planning', label: 'Urban Planning & Design' },
  { value: 'accessibility', label: 'Accessibility & Inclusion' },
  { value: 'safety_security', label: 'Safety & Security' },
  { value: 'arts_culture', label: 'Arts & Culture' },
  { value: 'education', label: 'Education & Learning' },
  { value: 'health_wellness', label: 'Health & Wellness' },
  { value: 'technology_digital', label: 'Technology & Digital Services' },
  { value: 'economic_development', label: 'Economic Development' },
  { value: 'housing', label: 'Housing & Accommodation' },
  { value: 'waste_management', label: 'Waste Management & Recycling' },
  { value: 'energy_efficiency', label: 'Energy Efficiency & Renewable Energy' },
  { value: 'water_management', label: 'Water Management & Conservation' },
  { value: 'social_services', label: 'Social Services & Support' },
  { value: 'youth_services', label: 'Youth Services & Programs' },
  { value: 'elderly_services', label: 'Elderly Services & Support' },
  { value: 'other', label: 'Other' },
];

const IssueReportForm = ({ type, onSuccess, onCancel }: IssueReportFormProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>();
  
  const categories = type === 'suggestion' ? suggestionCategories : issueCategories;
  const selectedCategory = watch('category');
  const isOtherSelected = selectedCategory === 'other';

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('isPublic', isPublic.toString());
      
      // If "Other" is selected, append the details to description
      if (data.category === 'other' && data.otherDetails) {
        formData.append('description', `${data.description}\n\nOther category details: ${data.otherDetails}`);
      }

      images.forEach((image) => {
        formData.append('images', image);
      });

      // Use suggestionService for suggestions, issueService for issues
      if (type === 'suggestion') {
        return suggestionService.create(formData);
      } else {
        formData.append('type', type);
        return issueService.create(formData);
      }
    },
    onSuccess: () => {
      const message = type === 'suggestion' 
        ? 'Suggestion submitted successfully!'
        : 'Issue reported successfully!';
      toast.success(message);
      if (type === 'suggestion') {
        queryClient.invalidateQueries({ queryKey: ['mySuggestions'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['myIssues'] });
      }
      onSuccess();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit issue';
      toast.error(errorMessage);
      console.error('Issue submission error:', error);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {type === 'suggestion' ? 'Submit a Suggestion' : 'Report Issue'}
      </h2>

      <form onSubmit={handleSubmit((data) => {
        // Only submit if form is valid
        mutation.mutate(data, {
          onError: (error: any) => {
            // Error handling is in mutation definition
            console.error('Form submission error:', error);
          }
        });
      })} className="space-y-6">
        {/* Title - First */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={type === 'suggestion' ? 'Enter a title for your suggestion' : 'Enter a title for your issue'}
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Image Upload Container - Second */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attach Image
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gray-50 dark:bg-gray-700">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {images.length > 0 ? `${images.length} image(s) selected` : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 5 images</span>
            </label>
          </div>
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

        {/* Description - Third */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={type === 'suggestion' ? 'Describe your suggestion in detail...' : 'Describe the issue in detail...'}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Category Selection - Fourth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <label
                key={cat.value}
                className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-white dark:bg-gray-800"
              >
                <input
                  {...register('category', { required: 'Category is required' })}
                  type="radio"
                  value={cat.value}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{cat.label}</span>
              </label>
            ))}
          </div>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
          
          {/* Other Details Field - shown when "Other" is selected */}
          {isOtherSelected && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Please specify <span className="text-red-500">*</span>
              </label>
              <input
                {...register('otherDetails', { 
                  required: isOtherSelected ? 'Please provide details for "Other" category' : false 
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What category does this issue fall under?"
              />
              {errors.otherDetails && (
                <p className="text-red-500 text-sm mt-1">{errors.otherDetails.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Visibility Toggle - Before Submit */}
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Make this {type === 'suggestion' ? 'suggestion' : 'issue'} public
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isPublic 
                  ? `This ${type === 'suggestion' ? 'suggestion' : 'issue'} will be visible to all users in the ${type === 'suggestion' ? 'suggestion' : 'issue'}'s county civic space.`
                  : `This ${type === 'suggestion' ? 'suggestion' : 'issue'} will only be visible to you.`}
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button - Final */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary-600 text-white py-3 px-8 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IssueReportForm;
