import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, recaptchaToken?: string, adminCode?: string) => {
    const response = await api.post('/auth/register', { email, password, recaptchaToken, adminCode });
    return response.data;
  },

  acceptTerms: async () => {
    const response = await api.post('/auth/accept-terms');
    return response.data;
  },
};

export const issueService = {
  getAll: async (params?: { category?: string; status?: string; type?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/issues', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
  },

  getMyIssues: async () => {
    const response = await api.get('/issues/my');
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/issues', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/issues/${id}/status`, { status });
    return response.data;
  },
};


export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  createProfile: async (data: {
    firstName: string;
    surname: string;
    dateOfBirth: string;
    address: string;
    ppsn: string;
    civicInterests: string[];
  }) => {
    const response = await api.post('/profile', data);
    return response.data;
  },

  updateProfile: async (data: {
    firstName: string;
    surname: string;
    dateOfBirth: string;
    address: string;
    ppsn: string;
    civicInterests: string[];
    county?: string;
  }) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  updateCounty: async (county: string) => {
    const response = await api.patch('/profile/county', { county });
    return response.data;
  },
};

export const suggestionService = {
  getMySuggestions: async () => {
    const response = await api.get('/suggestions/my');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/suggestions/${id}`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/suggestions', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const civicSpaceService = {
  getByCounty: async (county: string) => {
    const response = await api.get('/civic-space', { params: { county } });
    return response.data;
  },
};

export const allPublicItemsService = {
  getAll: async (sort: string = 'newest', type: string = 'all') => {
    const response = await api.get('/all-public-items', { params: { sort, type } });
    return response.data;
  },
};

export const mapService = {
  getCountyStats: async () => {
    const response = await api.get('/map/county-stats');
    return response.data;
  },
};

export const weatherService = {
  getByCounty: async (county: string) => {
    const response = await api.get('/weather', { params: { county } });
    return response.data;
  },
};

export const newsService = {
  getByCounty: async (county: string, limit: number = 3) => {
    const response = await api.get('/news', { params: { county, limit } });
    return response.data;
  },
};

export const trendingService = {
  getAll: async () => {
    const response = await api.get('/trending');
    return response.data;
  },
};

export const appraisalService = {
  toggle: async (id: string, type: 'issue' | 'suggestion') => {
    const response = await api.post(`/appraisals/${id}/toggle`, { type });
    return response.data;
  },
  getStatus: async (id: string, type: 'issue' | 'suggestion') => {
    const response = await api.get(`/appraisals/${id}/status`, { params: { type } });
    return response.data;
  },
};

export const adminService = {
  // Admin locations
  setAdminLocations: async (counties: string[]) => {
    const response = await api.post('/admin/locations', { counties });
    return response.data;
  },
  getAdminLocations: async () => {
    const response = await api.get('/admin/locations');
    return response.data;
  },
  getAllCountyAssignments: async () => {
    const response = await api.get('/admin/locations/all');
    return response.data;
  },
  // Admin issues and suggestions (filtered by their counties)
  getIssuesForAdmin: async (caseId?: string) => {
    const params = caseId ? { caseId } : {};
    const response = await api.get('/admin/issues', { params });
    return response.data;
  },
  getSuggestionsForAdmin: async (caseId?: string) => {
    const params = caseId ? { caseId } : {};
    const response = await api.get('/admin/suggestions', { params });
    return response.data;
  },
  updateIssueStatus: async (id: string, status: string, adminNote?: string) => {
    const response = await api.patch(`/admin/issues/${id}/status`, { status, adminNote });
    return response.data;
  },
  updateSuggestionStatus: async (id: string, status: string, adminNote?: string) => {
    const response = await api.patch(`/admin/suggestions/${id}/status`, { status, adminNote });
    return response.data;
  },
  // Admin user management
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  banUser: async (userId: string, banType: '24h' | '7d' | 'permanent', reason?: string) => {
    const response = await api.post('/admin/users/ban', { userId, banType, reason });
    return response.data;
  },
  unbanUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}/ban`);
    return response.data;
  },
  // Legacy methods (for backward compatibility)
  getAllIssues: async (params?: { status?: string; category?: string }) => {
    const response = await api.get('/admin/issues', { params });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  deleteIssue: async (id: string) => {
    const response = await api.delete(`/admin/issues/${id}`);
    return response.data;
  },
};

export const themeService = {
  getThemePreference: async () => {
    const response = await api.get('/theme/preference');
    return response.data;
  },
  setThemePreference: async (theme: 'light' | 'dark') => {
    const response = await api.post('/theme/preference', { theme });
    return response.data;
  },
};

export const banService = {
  getBanDetails: async () => {
    const response = await api.get('/ban/details');
    return response.data;
  },
};

export const adminMessagesService = {
  getIssueTypes: async () => {
    const response = await api.get('/admin-messages/issue-types');
    return response.data;
  },
  createMessage: async (issueType: string, description: string) => {
    const response = await api.post('/admin-messages/messages', { issueType, description });
    return response.data;
  },
  getUserMessages: async () => {
    const response = await api.get('/admin-messages/messages');
    return response.data;
  },
  getAdminMessages: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin-messages/admin/messages', { params });
    return response.data;
  },
  markMessageAsViewed: async (messageId: string) => {
    const response = await api.patch(`/admin-messages/admin/messages/${messageId}/viewed`);
    return response.data;
  },
  updateMessageStatus: async (messageId: string, status: string, adminResponse?: string) => {
    const response = await api.patch(`/admin-messages/admin/messages/${messageId}/status`, { status, adminResponse });
    return response.data;
  },
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/admin-messages/admin/messages/${messageId}`);
    return response.data;
  },
  getUserProfileByAdmin: async (userId: string) => {
    const response = await api.get(`/admin-messages/admin/users/${userId}/profile`);
    return response.data;
  },
  updateUserProfileByAdmin: async (userId: string, profileData: { firstName?: string; surname?: string; dateOfBirth?: string; ppsn?: string; address?: string }) => {
    const response = await api.patch(`/admin-messages/admin/users/${userId}/profile`, profileData);
    return response.data;
  },
};

export const analyticsService = {
  getCategoryAnalytics: async () => {
    const response = await api.get('/analytics/categories');
    return response.data;
  },
  getTrendsOverTime: async (period?: string) => {
    const response = await api.get('/analytics/trends', { params: { period } });
    return response.data;
  },
  getGeographicDistribution: async () => {
    const response = await api.get('/analytics/geographic');
    return response.data;
  },
  getOverallStats: async () => {
    const response = await api.get('/analytics/overall');
    return response.data;
  },
};

export default api;
