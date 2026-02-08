import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { banService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const Banned = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const { data: banData, isLoading } = useQuery({
    queryKey: ['banDetails'],
    queryFn: () => banService.getBanDetails(),
    enabled: isAuthenticated,
    refetchInterval: 1000, // Refetch every second for real-time updates
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (banData && !banData.banned) {
      // Ban expired or user is not banned, redirect to dashboard
      navigate('/dashboard');
    }
  }, [banData, navigate]);

  useEffect(() => {
    if (!banData?.banned || banData.isPermanent) {
      return;
    }

    const updateCountdown = () => {
      if (!banData.bannedUntil) return;

      const now = new Date().getTime();
      const banUntil = new Date(banData.bannedUntil).getTime();
      const difference = banUntil - now;

      if (difference <= 0) {
        setTimeRemaining('Ban expired');
        // Refetch to trigger unban
        window.location.reload();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [banData]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!banData?.banned) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border-2 border-red-500">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg
                className="h-8 w-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Account Banned
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your account has been temporarily suspended
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-3">
              Ban Details
            </h2>
            
            {banData.banReason && (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                  Reason:
                </p>
                <p className="text-red-900 dark:text-red-200 whitespace-pre-wrap">
                  {banData.banReason}
                </p>
              </div>
            )}

            {banData.bannedBy && (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Banned by:
                </p>
                <p className="text-red-900 dark:text-red-200">
                  {banData.bannedBy}
                </p>
              </div>
            )}

            {banData.bannedAt && (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Ban issued on:
                </p>
                <p className="text-red-900 dark:text-red-200">
                  {new Date(banData.bannedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {banData.isPermanent ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Permanent Ban
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                This ban is permanent. If you believe this is an error, please contact support.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Time Remaining
              </p>
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-200 mb-2">
                {timeRemaining || 'Calculating...'}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Your account will be automatically restored when the ban expires
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/civicfix?tab=login');
              }}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banned;
