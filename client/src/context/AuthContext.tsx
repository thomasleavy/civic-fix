import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService, banService } from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: number;
  themePreference?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, recaptchaToken?: string, adminCode?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  termsAccepted: boolean;
  acceptTerms: () => Promise<void>;
  isBanned: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      authService.setAuthToken(storedToken);
    }
  }, []);

  // Check ban status for authenticated users
  const { data: banData } = useQuery({
    queryKey: ['banDetails'],
    queryFn: () => banService.getBanDetails(),
    enabled: !!token,
    refetchInterval: 300000, // Check every 5 minutes instead of 30 seconds to avoid rate limiting
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    onError: (error) => {
      // Silently handle errors - don't block the app if ban check fails
      console.warn('Ban status check failed:', error);
    },
  });

  const isBanned = banData?.banned === true;

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    authService.setAuthToken(response.token);
    return response; // Return response so caller can check termsAccepted
  };

  const acceptTerms = async () => {
    const response = await authService.acceptTerms();
    // Update user in state and localStorage with terms acceptance info
    const updatedUser = { 
      ...user, 
      termsAccepted: true,
      termsAcceptedAt: response.user?.termsAcceptedAt || new Date().toISOString(),
      termsVersion: response.user?.termsVersion || 1
    } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const register = async (email: string, password: string, recaptchaToken?: string, adminCode?: string) => {
    const response = await authService.register(email, password, recaptchaToken, adminCode);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    authService.setAuthToken(response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authService.setAuthToken(null);
    // Optional: Redirect to home page after logout
    // This is handled in Navbar component
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        termsAccepted: user?.termsAccepted ?? false,
        acceptTerms,
        isBanned,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
