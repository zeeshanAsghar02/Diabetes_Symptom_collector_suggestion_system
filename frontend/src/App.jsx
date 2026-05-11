// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/useThemeContext';
import { useSettings } from './context/SettingsContext';
import LandingPage from './pages/LandingPage';
import SignInSide from './pages/SignInSide';
import SignUpSide from './pages/SignUpSide';
import ActivateAccount from './pages/ActivateAccount';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UniversalHeader from './components/Common/UniversalHeader';
import CMSManagement from './cms/pages/CMSManagement';
import PublicCMS from './cms/pages/PublicCMS';
import DocumentUpload from './admin/DocumentUpload';
import CommunityFeedbackDashboard from './pages/CommunityFeedbackDashboard';
import ArticlesPage from './pages/ArticlesPage';
import DiagnosisQuestion from './pages/DiagnosisQuestion';
import SymptomAssessment from './pages/SymptomAssessment';
import PersonalizedSuggestionSystem from './pages/PersonalizedSuggestionSystem';
import PersonalizedSuggestionDashboard from './pages/PersonalizedSuggestionDashboard';
import PersonalMedicalInfoPage from './pages/PersonalMedicalInfoPage';
import DietPlanDashboard from './pages/DietPlanDashboard';
import ExercisePlanDashboard from './pages/ExercisePlanDashboard';
import LifestyleTipsDashboard from './pages/LifestyleTipsDashboard';
import ChatAssistant from './pages/ChatAssistant';
import { ToastContainer } from 'react-toastify';
import NotFound from './pages/NotFound';
import ProtectedRoute, { RoleProtectedRoute } from './components/Common/ProtectedRoute';
import { OnboardingProvider } from './contexts/OnboardingContext';
import 'react-toastify/dist/ReactToastify.css';

// Component to conditionally render header
const AppContent = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { siteTitle } = useSettings();

  useEffect(() => {
    if (siteTitle) document.title = siteTitle;
  }, [siteTitle]);
  
  // Pages where we don't want the universal header (landing `/` uses the same sticky header as the app)
  // Also hide header for admin/super-admin routes.
  const noHeaderPages = ['/signin', '/signup', '/forgotpassword', '/reset-password', '/dashboard', '/admin-dashboard'];
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-') || location.pathname.startsWith('/admin/');
  const shouldShowHeader = !noHeaderPages.includes(location.pathname) && 
                          !isAdminRoute &&
                          !location.pathname.startsWith('/activate/') &&
                          !location.pathname.startsWith('/reset-password/') &&
                          !location.pathname.startsWith('/content/');

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: (theme) => theme.palette.background.gradient || theme.palette.background.default,
      transition: 'background 0.3s ease'
    }}>
      {shouldShowHeader && <UniversalHeader />}
      <Box> {/* Removed top padding to eliminate space between header and content */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInSide />} />
          <Route path="/signup" element={<SignUpSide />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Onboarding is public — unauthenticated users land here from "Get Started" */}
          <Route path="/onboarding" element={<Onboarding />} />
          {/* DiagnosisQuestion & SymptomAssessment share OnboardingProvider state (provided at App level) */}
          <Route path="/diagnosis-question" element={<DiagnosisQuestion />} />
          <Route path="/symptom-assessment" element={<SymptomAssessment />} />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/upload"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <DocumentUpload />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/cms"
            element={
              <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <CMSManagement />
              </RoleProtectedRoute>
            }
          />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/content" element={<PublicCMS />} />
          <Route path="/content/:slug" element={<PublicCMS />} />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <CommunityFeedbackDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions"
            element={
              <ProtectedRoute>
                <PersonalizedSuggestionSystem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/dashboard"
            element={
              <ProtectedRoute>
                <PersonalizedSuggestionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/personal-medical"
            element={
              <ProtectedRoute>
                <PersonalMedicalInfoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/diet-plan"
            element={
              <ProtectedRoute>
                <DietPlanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/exercise-plan"
            element={
              <ProtectedRoute>
                <ExercisePlanDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/lifestyle-tips"
            element={
              <ProtectedRoute>
                <LifestyleTipsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personalized-suggestions/chat-assistant"
            element={
              <ProtectedRoute>
                <ChatAssistant />
              </ProtectedRoute>
            }
          />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
