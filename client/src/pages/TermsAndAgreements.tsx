import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import toast from 'react-hot-toast';

const TermsAndAgreements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewOnly = searchParams.get('view') === 'true';
  const { isAuthenticated, acceptTerms, termsAccepted, user } = useAuth();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Check if user has a county set
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
    enabled: isAuthenticated,
  });

  const hasCounty = profileData?.profile?.county;

  const mutation = useMutation({
    mutationFn: () => acceptTerms(),
    onSuccess: () => {
      toast.success('Terms and conditions accepted!');
      // If user doesn't have a county, redirect to location selection
      // Otherwise, go to dashboard
      if (!hasCounty) {
        navigate('/location');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to accept terms');
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/civicfix?tab=login');
    return null;
  }

  // If terms already accepted and not in view-only mode, redirect to dashboard
  // (Users shouldn't be forced to accept terms again if they've already accepted)
  useEffect(() => {
    if (termsAccepted && !viewOnly) {
      navigate('/dashboard');
    }
  }, [termsAccepted, viewOnly, navigate]);

  // If view-only mode and terms already accepted, show read-only view
  const isViewOnly = viewOnly && termsAccepted;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isViewOnly) return; // Don't track scroll in view-only mode
    const target = e.currentTarget;
    const scrolled = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (scrolled && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleAccept = () => {
    if (!agreed) {
      toast.error('Please check the agreement checkbox');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms and Conditions of Use</h1>
            {isViewOnly ? (
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  You agreed to these terms and conditions when you signed up for CivicFix.
                </p>
                {termsAccepted && user?.termsAcceptedAt && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ You accepted these terms on {new Date(user.termsAcceptedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Please read and accept the following terms and conditions to continue using CivicFix.
              </p>
            )}
          </div>

          <div
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700"
            onScroll={handleScroll}
          >
            <div className="prose max-w-none dark:prose-invert">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using CivicFix, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">2. Purpose of the Platform</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                CivicFix is a community issue reporting and suggestion platform designed to facilitate communication between 
                citizens and local authorities. The platform allows users to report issues (such as potholes, street lighting, 
                litter) and submit suggestions for community improvements.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. User Responsibilities</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                As a user of CivicFix, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-4">
                <li>Provide accurate and truthful information when reporting issues or submitting suggestions</li>
                <li>Use the platform only for legitimate civic reporting and community improvement purposes</li>
                <li>Respect the rights and privacy of others</li>
                <li>Not submit false, misleading, or fraudulent reports</li>
                <li>Not use the platform for any illegal activities or to harass, threaten, or harm others</li>
                <li>Not submit spam, duplicate reports, or malicious content</li>
                <li>Not impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
                <li>Not upload content that contains viruses, malware, or other harmful code</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">4. Prohibited Conduct</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-4">
                <li>Submit reports or suggestions that are defamatory, libelous, obscene, pornographic, abusive, or offensive</li>
                <li>Submit reports about criminal activities (this platform is not for reporting crimes - contact local law enforcement)</li>
                <li>Use the platform to promote commercial products or services without authorisation</li>
                <li>Attempt to gain unauthorized access to the platform or interfere with its operation</li>
                <li>Collect or harvest information about other users without their consent</li>
                <li>Use automated systems (bots, scrapers) to access the platform without permission</li>
                <li>Submit reports that violate any applicable laws or regulations</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">5. Content Submission</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you submit an issue report or suggestion:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-4">
                <li>You retain ownership of the content you submit, but grant CivicFix a licence to use, display, and distribute your content for platform purposes</li>
                <li>You represent that you have the right to submit the content and that it does not violate any third-party rights</li>
                <li>You understand that submitted content may be reviewed by administrators before being processed</li>
                <li>You acknowledge that images and descriptions you submit may be shared with relevant authorities for resolution purposes</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your use of CivicFix is also governed by our Privacy Policy. By using the platform, you consent to:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-4">
                <li>The collection and processing of your personal information as described in our Privacy Policy</li>
                <li>The sharing of your issue reports and suggestions with relevant local authorities for resolution purposes</li>
                <li>Receiving email notifications regarding the status of your submissions</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">7. Account Security</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities 
                that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">8. Platform Availability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                CivicFix is provided "as is" and we do not guarantee that the platform will be available at all times or 
                free from errors. We reserve the right to modify, suspend, or discontinue the platform at any time.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                CivicFix and its operators are not responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-2 ml-4">
                <li>The resolution or non-resolution of reported issues or suggestions</li>
                <li>Any actions taken or not taken by local authorities in response to submissions</li>
                <li>Any damages resulting from the use or inability to use the platform</li>
                <li>The accuracy or completeness of information submitted by users</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">10. Account Termination</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to suspend or terminate your account if you violate these terms, engage in prohibited 
                conduct, or for any other reason we deem necessary. You may also terminate your account at any time.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these terms at any time. Continued use of the platform after changes 
                constitutes acceptance of the modified terms. We will notify users of significant changes via email.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">12. Contact Information</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about these terms, please contact us through the platform or via the contact 
                information provided on our website.
              </p>

              <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {!isViewOnly && !hasScrolled && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Please scroll to read all terms and conditions before accepting.</strong>
              </p>
            </div>
          )}

          {!isViewOnly && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start space-x-3 mb-6">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  disabled={!hasScrolled}
                  className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700"
                />
                <label
                  htmlFor="agree"
                  className={`text-sm ${!hasScrolled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 cursor-pointer'}`}
                >
                  <strong>I have read and agree to the Terms and Conditions of Use.</strong> I understand that 
                  violation of these terms may result in account suspension or termination. I agree to use 
                  CivicFix responsibly and only for legitimate civic reporting and community improvement purposes.
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAccept}
                  disabled={!agreed || !hasScrolled || mutation.isPending}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {mutation.isPending ? 'Processing...' : 'I Agree to Terms of Use'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('You must accept the terms to use CivicFix. Do you want to log out?')) {
                      // Logout logic would go here
                      navigate('/civicfix?tab=login');
                    }
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {isViewOnly && (
            <div className="border-t pt-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndAgreements;
