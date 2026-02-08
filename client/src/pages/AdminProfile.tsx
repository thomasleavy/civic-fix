import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';

// 26 Counties of Ireland (Republic of Ireland)
const IRISH_COUNTIES = [
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Donegal',
  'Dublin',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
];

const AdminProfile = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);

  // Fetch current admin locations
  const { data: currentLocationsData } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.getAdminLocations(),
    enabled: isAuthenticated && isAdmin,
  });

  // Fetch all county assignments to show which are available
  const { data: allAssignmentsData } = useQuery({
    queryKey: ['admin', 'locations', 'all'],
    queryFn: () => adminService.getAllCountyAssignments(),
    enabled: isAuthenticated && isAdmin,
  });

  // Load current locations when data is available
  useEffect(() => {
    if (currentLocationsData?.locations) {
      setSelectedCounties(currentLocationsData.locations);
    }
  }, [currentLocationsData]);

  const mutation = useMutation({
    mutationFn: (counties: string[]) => adminService.setAdminLocations(counties),
    onSuccess: () => {
      toast.success('Admin locations updated successfully!');
      navigate('/admin-dashboard');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Failed to save admin locations';
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/civicfix?tab=login');
    } else if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Get which counties are assigned to other admins
  const countyAssignments = allAssignmentsData?.assignments || [];
  const getCountyStatus = (county: string) => {
    const assignment = countyAssignments.find((a: any) => a.county === county);
    if (!assignment) return 'available'; // No admin assigned
    if (assignment.is_current_admin) return 'current'; // Assigned to current admin
    return 'assigned'; // Assigned to another admin
  };

  const toggleCounty = (county: string) => {
    const status = getCountyStatus(county);
    // Can only toggle counties that are available or currently assigned to this admin
    if (status === 'assigned') {
      toast.error(`This county is already assigned to another admin (${countyAssignments.find((a: any) => a.county === county)?.admin_email})`);
      return;
    }
    
    setSelectedCounties(prev =>
      prev.includes(county)
        ? prev.filter(c => c !== county)
        : [...prev, county]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCounties.length === 0) {
      toast.error('Please select at least one county');
      return;
    }
    mutation.mutate(selectedCounties);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {currentLocationsData?.locations && currentLocationsData.locations.length > 0 
              ? 'Update Admin Locations' 
              : 'Admin Profile Setup'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Select the counties you will be responsible for managing. You can select multiple counties.
            You will be able to view and manage all issues and suggestions (both public and private) for these counties.
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
            <strong>Note:</strong> Each county can only be assigned to one admin. Counties already assigned to other admins cannot be selected.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Counties <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {IRISH_COUNTIES.map((county) => {
                  const status = getCountyStatus(county);
                  const assignment = countyAssignments.find((a: any) => a.county === county);
                  const isSelected = selectedCounties.includes(county);
                  const isDisabled = status === 'assigned';
                  
                  return (
                    <div
                      key={county}
                      className={`flex items-center space-x-2 p-3 border rounded-md ${
                        isDisabled
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-60 pointer-events-none'
                          : isSelected
                          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                      title={
                        isDisabled 
                          ? `Assigned to: ${assignment?.admin_email || 'Another admin'}`
                          : isSelected
                          ? 'Click to deselect'
                          : 'Click to select'
                      }
                      onClick={isDisabled ? undefined : () => toggleCounty(county)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent onClick
                        disabled={isDisabled}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none"
                      />
                      <div className="flex-1">
                        <span className={`text-sm ${isDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {county}
                        </span>
                        {isDisabled && assignment && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            (Assigned to {assignment.admin_email})
                          </div>
                        )}
                        {status === 'current' && !isSelected && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            (Currently yours)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedCounties.length > 0 && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Selected: <strong className="text-gray-900 dark:text-white">{selectedCounties.join(', ')}</strong>
                </p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedCounties.length === 0 || mutation.isPending}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {mutation.isPending ? 'Saving...' : currentLocationsData?.locations && currentLocationsData.locations.length > 0 ? 'Update Locations' : 'Save Admin Locations'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
