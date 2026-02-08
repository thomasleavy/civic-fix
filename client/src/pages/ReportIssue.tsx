import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/api';
import IssueReportForm from '../components/IssueReportForm';
import { useEffect } from 'react';

const ReportIssue = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  const hasCounty = profileData?.profile?.county;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Report an Issue</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Report issues in your local area that need attention from the council.
        </p>
        {hasCounty && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Your issue will be registered to: <strong className="text-gray-700 dark:text-gray-300">📍 {profileData.profile.county}</strong>
          </p>
        )}
      </div>

      {!hasCounty && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <p className="text-yellow-800 mb-4">
            <strong>Location Required:</strong> Please select your county before submitting an issue.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Select Your Location
          </button>
        </div>
      )}

      {hasCounty && (
        <IssueReportForm
          type="issue"
          onSuccess={() => {
            navigate('/my-issues');
          }}
          onCancel={() => {
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default ReportIssue;
