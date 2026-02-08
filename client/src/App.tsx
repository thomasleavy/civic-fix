import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import { ProfileGuard } from './components/ProfileGuard';
import Home from './pages/Home';
import MapView from './pages/MapView';
import IssueDetail from './pages/IssueDetail';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import MyIssues from './pages/MyIssues';
import MySuggestions from './pages/MySuggestions';
import SuggestionDetail from './pages/SuggestionDetail';
import TermsAndAgreements from './pages/TermsAndAgreements';
import LocationSelection from './pages/LocationSelection';
import CivicSpace from './pages/CivicSpace';
import About from './pages/About';
import ReportIssue from './pages/ReportIssue';
import SubmitSuggestion from './pages/SubmitSuggestion';
import AdminProfile from './pages/AdminProfile';
import AdminUsers from './pages/AdminUsers';
import Banned from './pages/Banned';
import Analytics from './pages/Analytics';
import ContactAdministrator from './pages/ContactAdministrator';
import AdminInbox from './pages/AdminInbox';

function App() {
  return (
    <Router
      basename={import.meta.env.BASE_URL.replace(/\/$/, '')}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="pt-16">
            <Routes>
            <Route path="/" element={<Navigate to="/civicfix" replace />} />
            <Route path="/civicfix" element={<Home />} />
            <Route path="/login" element={<Navigate to="/civicfix?tab=login" replace />} />
            <Route path="/register" element={<Navigate to="/civicfix?tab=register" replace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/terms" element={<TermsAndAgreements />} />
            <Route path="/about" element={<About />} />
            <Route path="/banned" element={<Banned />} />
            <Route path="/analytics" element={<Analytics />} />
            {/* Public routes that don't require authentication */}
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/suggestions/:id" element={<SuggestionDetail />} />
            {/* Routes that require authentication but not profile completion */}
            <Route path="/civic-space" element={<CivicSpace />} />
            <Route path="/map" element={<MapView />} />
            {/* Protected routes that require profile completion */}
            <Route path="/dashboard" element={<ProfileGuard><Dashboard /></ProfileGuard>} />
            <Route path="/issue" element={<ProfileGuard><ReportIssue /></ProfileGuard>} />
            <Route path="/suggestion" element={<ProfileGuard><SubmitSuggestion /></ProfileGuard>} />
            <Route path="/my-issues" element={<ProfileGuard><MyIssues /></ProfileGuard>} />
            <Route path="/my-suggestions" element={<ProfileGuard><MySuggestions /></ProfileGuard>} />
            <Route path="/contact-administrator" element={<ProfileGuard><ContactAdministrator /></ProfileGuard>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-profile" element={<AdminProfile />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/admin-inbox" element={<AdminInbox />} />
            <Route path="/admin-users" element={<AdminUsers />} />
            <Route path="/banned" element={<Banned />} />
            <Route path="/location" element={<LocationSelection />} />
            </Routes>
            </div>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
