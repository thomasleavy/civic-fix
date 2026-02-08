import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { themeService } from '../services/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  
  // Get initial theme - always start with light mode
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [wasAuthenticated, setWasAuthenticated] = useState<boolean>(isAuthenticated);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    // Force browser to recognize the change
    html.style.colorScheme = newTheme;
  };

  // Apply theme whenever it changes (including initial mount)
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Reset to light mode when user logs out
  useEffect(() => {
    // Only reset if user was previously authenticated and now is not (actual logout)
    if (wasAuthenticated && !isAuthenticated) {
      // User logged out - reset to light mode
      setTheme('light');
      applyTheme('light');
      // Clear theme from localStorage on logout
      localStorage.removeItem('theme');
    }
    // Update wasAuthenticated to track state changes
    setWasAuthenticated(isAuthenticated);
  }, [isAuthenticated, wasAuthenticated]);

  // Load user's theme preference when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadUserTheme = async () => {
      try {
        // First check if themePreference is in the user object from login response
        if (user.themePreference && (user.themePreference === 'dark' || user.themePreference === 'light')) {
          const userTheme = user.themePreference as Theme;
          setTheme(userTheme);
          applyTheme(userTheme);
          localStorage.setItem('theme', userTheme);
          return;
        }

        // If not in user object, fetch from API
        const preference = await themeService.getThemePreference();
        if (preference?.theme) {
          const userTheme = preference.theme as Theme;
          setTheme(userTheme);
          applyTheme(userTheme);
          localStorage.setItem('theme', userTheme);
        } else {
          // If no preference saved, default to light
          setTheme('light');
          applyTheme('light');
          localStorage.setItem('theme', 'light');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // On error, default to light mode
        setTheme('light');
        applyTheme('light');
      }
    };

    loadUserTheme();
  }, [isAuthenticated, user]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    
    // Update state and apply immediately
    setTheme(newTheme);
    applyTheme(newTheme); // Apply immediately, not waiting for useEffect
    localStorage.setItem('theme', newTheme);

    // Save to API if authenticated (don't block on this)
    if (isAuthenticated && user) {
      themeService.setThemePreference(newTheme).catch((error) => {
        console.warn('⚠️ Failed to save theme to API (using localStorage):', error);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
