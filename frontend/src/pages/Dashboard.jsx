import React from 'react';
import { useEffect } from 'react';
import {
  Box, Typography, CssBaseline, Paper, Card, CardContent, CardActions, CircularProgress, Alert, Grid, Divider, Chip, Modal, IconButton, Tooltip, Skeleton, TextField, ToggleButtonGroup, ToggleButton, SpeedDial, SpeedDialAction, SpeedDialIcon, Accordion, AccordionSummary, AccordionDetails, Menu, MenuItem, Fade, Zoom
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HealingIcon from '@mui/icons-material/Healing';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ChatIcon from '@mui/icons-material/Chat';
import MenuIcon from '@mui/icons-material/Menu';
import Button from '@mui/material/Button';
import EditDiseaseData from '../components/Dashboard/EditDiseaseData';
import ProgressDonut from '../components/DashboardNew/ProgressDonut';
import StatWidget from '../components/DashboardNew/StatWidget';
import ActivityTimeline from '../components/DashboardNew/ActivityTimeline';
import RiskCard from '../components/DashboardNew/RiskCard';
import DiabetesDiagnosisPopup from '../components/Common/DiabetesDiagnosisPopup';
import AssessmentInsightPopup from '../components/Common/AssessmentInsightPopup';
import PersonalMedicalInfoPage from './PersonalMedicalInfoPage';
import DietPlanDashboard from './DietPlanDashboard';
import ExercisePlanDashboard from './ExercisePlanDashboard';
import LifestyleTipsDashboard from './LifestyleTipsDashboard';
import ChatAssistant from './ChatAssistant';
import { STICKY_HEADER_OFFSET_PX } from '../components/Common/UniversalHeader';
import SidebarNavigation from '../layout/SidebarNavigation';
import MobileDrawer from '../layout/MobileDrawer';
import GoalDialog from '../components/modals/GoalDialog';
import DayDetailsModal from '../components/modals/DayDetailsModal';
import ShortcutsDialog from '../components/modals/ShortcutsDialog';
import AccountSection from '../components/dashboard/sections/AccountSection';
import DiseaseDataSection from '../components/dashboard/sections/DiseaseDataSection';
import CheckRiskSection from '../components/dashboard/sections/CheckRiskSection';
import FeedbackSection from '../components/dashboard/sections/FeedbackSection';
import DiagnosedInsightsView from '../components/dashboard/views/DiagnosedInsightsView';
import UndiagnosedInsightsView from '../components/dashboard/views/UndiagnosedInsightsView';
import PersonalizedSuggestionsView from '../components/dashboard/views/PersonalizedSuggestionsView';
import dashboardTheme from '../theme/dashboardTheme';

// Custom Hooks
import useDashboardState from '../hooks/useDashboardState.jsx';
import useHealthMetrics from '../hooks/useHealthMetrics';
import useDashboardDataFetching from '../hooks/useDashboardDataFetching.jsx';
import useDashboardHandlers from '../hooks/useDashboardHandlers.jsx';

const drawerWidth = 220;
const miniDrawerWidth = 64;

const undiagnosedSections = [
  { label: 'Dashboard', icon: <DashboardIcon /> },
  { label: 'My Account', icon: <AccountCircleIcon /> },
  { label: 'My Disease Data', icon: <HealingIcon /> },
  { label: 'Check My Risk', icon: <AutoAwesomeIcon /> },
  { label: 'My Feedback', icon: <RateReviewIcon /> },
];

const diagnosedSections = [
  { label: 'Dashboard', icon: <DashboardIcon /> },
  { label: 'My Account', icon: <AccountCircleIcon /> },
  { label: 'Personalized Suggestions', icon: <AutoAwesomeIcon /> },
  { label: 'Chat Assistant', icon: <ChatIcon /> },
  { label: 'My Feedback', icon: <RateReviewIcon /> },
];

function Dashboard() {
  // Initialize all dashboard state using custom hook
  const state = useDashboardState();

  // Destructure commonly used state
  const {
    user, setUser,
    selectedIndex, setSelectedIndex,
    diseaseData, setDiseaseData,
    loading, setLoading,
    error, setError,
    showEditModal, setShowEditModal,
    showDiagnosisPopup, setShowDiagnosisPopup,
    showAssessmentPopup, setShowAssessmentPopup,
    showFeedbackForm, setShowFeedbackForm,
    openCardModal, setOpenCardModal,
    personalInfoCompletion, setPersonalInfoCompletion,
    refreshTrigger, setRefreshTrigger,
    personalInfo, setPersonalInfo,
    medicalInfo, setMedicalInfo,
    dietHistory, setDietHistory,
    exerciseHistory, setExerciseHistory,
    lifestyleHistory, setLifestyleHistory,
    assessmentSummary, setAssessmentSummary,
    assessmentLoading, setAssessmentLoading,
    sidebarOpen, setSidebarOpen,
    mobileOpen, setMobileOpen,
    chartTimeRange, setChartTimeRange,
    expandedSections, setExpandedSections,
    healthGoals, setHealthGoals,
    showGoalDialog, setShowGoalDialog,
    showAddGoalDialog, setShowAddGoalDialog,
    newGoal, setNewGoal,
    selectedDayData, setSelectedDayData,
    selectedDay, setSelectedDay,
    showDayDetailsModal, setShowDayDetailsModal,
    exportMenuAnchor, setExportMenuAnchor,
    showKeyboardShortcuts, setShowKeyboardShortcuts,
    showShortcutsDialog, setShowShortcutsDialog,
    animatedValues, setAnimatedValues,
    refs,
    savingProfile, setSavingProfile,
    profileError, setProfileError,
  } = state;

  // Get sections based on user diagnosis status
  const sections = user?.diabetes_diagnosed === 'yes' ? diagnosedSections : undiagnosedSections;
  const currentSection = sections[selectedIndex]?.label;

  // Calculate health metrics using custom hook
  const metrics = useHealthMetrics({
    user,
    diseaseData,
    personalInfo,
    medicalInfo,
    dietHistory: dietHistory || [],
    exerciseHistory: exerciseHistory || [],
    lifestyleHistory: lifestyleHistory || [],
    chartTimeRange,
  });

  const {
    completionPct,
    activityItems,
    bmiAnalytics,
    planUsageAnalytics,
    macronutrientBalance,
    mealWiseDistribution,
  } = metrics;

  // Data fetching using custom hook
  useDashboardDataFetching({
    ...state,
    currentSection,
    bmiAnalytics,
  });

  // Event handlers using custom hook
  const {
    toggleSection,
    scrollToSection,
    handleAddGoal,
    handleDeleteGoal,
    handleUpdateGoalProgress,
    handleChartPointClick,
    handleExportPDF,
    handleExportCSV,
    getTrendIcon,
    calculateTrend,
    handleLogout,
    handleDiagnosisAnswer,
    handleAssessmentPopupAnswer,
    handleEditDiseaseData,
    handleCloseEditModal,
    handleDataUpdated,
    handleSaveProfile,
  } = useDashboardHandlers({
    ...state,
    planUsageAnalytics,
    diagnosedSections,
  });

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Data Debug:', {
      user: user,
      diseaseData: diseaseData,
      personalInfo: personalInfo,
      medicalInfo: medicalInfo,
      dietHistory: dietHistory?.length || 0,
      exerciseHistory: exerciseHistory?.length || 0,
      bmiAnalytics: bmiAnalytics,
      planUsageAnalytics: planUsageAnalytics,
    });
  }, [user, diseaseData, personalInfo, medicalInfo, dietHistory, exerciseHistory, bmiAnalytics, planUsageAnalytics]);

  // Password: we only provide a navigation option to the existing flow

  // No-op: assessments navigated inline via onClick handlers

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: { 
        xs: '#f8fafb',
        md: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)'
      },
      position: 'relative',
      overflow: 'hidden',
    }}>
      <CssBaseline />
      
      {/* Mobile Drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sections={sections}
        selectedIndex={selectedIndex}
        onSectionChange={(index) => {
          setSelectedIndex(index);
          if (index !== 4) setShowFeedbackForm(false);
        }}
        onLogout={handleLogout}
        user={user}
      />
      
      {/* Desktop Sidebar */}
      <SidebarNavigation
        sections={sections}
        selectedIndex={selectedIndex}
        onSectionChange={(index) => {
          setSelectedIndex(index);
          if (index !== 4) setShowFeedbackForm(false);
        }}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        user={user}
      />
      {/* Main Content */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        ml: 0, 
        mt: 0, 
        minHeight: '100vh', 
        bgcolor: 'transparent',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: { 
          xs: '100%', 
          md: `calc(100% - ${sidebarOpen ? drawerWidth : miniDrawerWidth}px)` 
        },
        pt: { xs: 0, md: 0 },
      }}>
        {/* Mobile Menu Button - Enhanced */}
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            top: { xs: STICKY_HEADER_OFFSET_PX.xs, sm: STICKY_HEADER_OFFSET_PX.sm },
            left: { xs: 12, sm: 16 },
            zIndex: 1200,
            bgcolor: 'background.paper',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(10px)',
            border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            width: { xs: 44, sm: 48 },
            height: { xs: 44, sm: 48 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
              transform: 'scale(1.05)',
              boxShadow: '0 6px 24px rgba(102, 126, 234, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            }
          }}
        >
          <MenuIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
        {/* Content container - Responsive Padding */}
        <Box sx={{ 
          px: currentSection === 'Chat Assistant' ? 0 : { xs: 2, sm: 2.5, md: 3, lg: 4 }, 
          pt: currentSection === 'Chat Assistant' ? 0 : { xs: 2, sm: 3, md: 4, lg: 5 }, 
          pb: currentSection === 'Chat Assistant' ? 0 : { xs: 4, sm: 5, md: 6 }, 
          display: 'flex', 
          justifyContent: 'center', 
          position: 'relative', 
          zIndex: 1,
          height: currentSection === 'Chat Assistant' ? '100vh' : 'auto',
          animation: 'fadeIn 0.4s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          <Box sx={{ 
            width: '100%', 
            maxWidth: currentSection === 'Dashboard'
              ? '100%'
              : selectedIndex === 2 
              ? '100%'
              : { 
                  xs: '100%', 
                  sm: '100%', 
                  md: 'min(1200px, 95vw)', 
                  lg: 'min(1400px, 92vw)',
                  xl: '1440px'
                },
            height: currentSection === 'Chat Assistant' ? '100%' : 'auto',
            margin: '0 auto',
          }}>
            {currentSection === 'Dashboard' && (
              <Box>
                {user?.diabetes_diagnosed === 'yes' ? (
                  <DiagnosedInsightsView 
                    planUsageAnalytics={planUsageAnalytics}
                    macronutrientBalance={macronutrientBalance}
                    mealWiseDistribution={mealWiseDistribution}
                    bmiAnalytics={bmiAnalytics}
                    personalInfo={personalInfo}
                    personalInfoCompletion={personalInfoCompletion}
                    medicalInfo={medicalInfo}
                    user={user}
                  />
                ) : (
                  <UndiagnosedInsightsView 
                    diseaseData={diseaseData}
                    completionPct={completionPct}
                    activityItems={activityItems}
                    assessmentSummary={assessmentSummary}
                    user={user}
                  />
                )}
              </Box>
            )}

            {currentSection === 'My Account' && (
              <AccountSection 
                user={user}
                setUser={setUser}
                profileError={profileError}
                savingProfile={savingProfile}
                handleSaveProfile={handleSaveProfile}
              />
            )}

            {currentSection === 'My Disease Data' && (
              <DiseaseDataSection 
                loading={loading}
                error={error}
                diseaseData={diseaseData}
                completionPct={completionPct}
                handleEditDiseaseData={handleEditDiseaseData}
              />
            )}

            {currentSection === 'Check My Risk' && (
              <CheckRiskSection />
            )}

            {currentSection === 'Personalized Suggestions' && (
              <Box sx={{ 
                bgcolor: 'transparent', 
                borderRadius: { xs: 2, md: 3 }, 
                p: { xs: 0, sm: 2, md: 3, lg: 5 }, 
                minHeight: { xs: 'auto', md: '70vh' }
              }}>
                <PersonalizedSuggestionsView 
                  personalInfoCompletion={personalInfoCompletion}
                  setOpenCardModal={setOpenCardModal}
                />
              </Box>
            )}

            {currentSection === 'Chat Assistant' && (
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                m: 0,
                p: 0
              }}>
                {personalInfoCompletion >= 100 ? (
                  <Box 
                    sx={{ 
                      height: '100vh',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      m: 0,
                      p: 0
                    }}
                  >
                    <ChatAssistant inModal={true} />
                  </Box>
                ) : (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      background: (t) => t.palette.background.paper,
                      border: (t) => `2px dashed ${alpha(t.palette.divider, 0.3)}`,
                      textAlign: 'center'
                    }}
                  >
                    <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
                      Chat Assistant Locked
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Complete your Personal & Medical Information to unlock the AI Chat Assistant
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Profile Completion: {personalInfoCompletion}%
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => {
                        const idx = diagnosedSections.findIndex((s) => s.label === 'Personalized Suggestions');
                        setSelectedIndex(idx >= 0 ? idx : 0);
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Complete Your Profile
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {currentSection === 'My Feedback' && (
              <FeedbackSection 
                showFeedbackForm={showFeedbackForm}
                setShowFeedbackForm={setShowFeedbackForm}
                user={user}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Assessment insight popup for high-risk users */}
      <AssessmentInsightPopup
        open={showAssessmentPopup}
        riskLevel={user?.last_assessment_risk_level}
        probability={user?.last_assessment_probability}
        assessedAt={user?.last_assessment_at}
        onSelectAnswer={handleAssessmentPopupAnswer}
      />

      {/* Diabetes Diagnosis Popup - REMOVED as per requirement */}
      {/* <DiabetesDiagnosisPopup
        open={showDiagnosisPopup}
        onAnswer={handleDiagnosisAnswer}
      /> */}

      {/* Edit Disease Data Modal */}
      <Modal
        open={showEditModal}
        onClose={handleCloseEditModal}
        aria-labelledby="edit-disease-data-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 1000,
            maxHeight: '90vh',
            bgcolor: '#fff',
            borderRadius: 3,
            boxShadow: 24,
            overflow: 'auto',
            p: 3,
            position: 'relative',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography id="edit-disease-data-modal" variant="h6" fontWeight={700} color="#23272f">
              Edit Disease Data
            </Typography>
            <IconButton onClick={handleCloseEditModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <EditDiseaseData
            onClose={handleCloseEditModal}
            onDataUpdated={handleDataUpdated}
          />
        </Box>
      </Modal>

      {/* Dynamic Insights Components */}
      {currentSection === 'Insights' && user?.diabetes_diagnosed === 'yes' && (
        <>
          {/* Add Goal Dialog */}
          <GoalDialog 
            open={showAddGoalDialog}
            goal={newGoal}
            onSave={handleAddGoal}
            onClose={() => setShowAddGoalDialog(false)}
          />

          {/* Day Details Modal */}
          <DayDetailsModal 
            open={showDayDetailsModal}
            dayData={selectedDayData}
            onClose={() => setShowDayDetailsModal(false)}
          />

          {/* Keyboard Shortcuts Dialog */}
          <ShortcutsDialog 
            open={showShortcutsDialog}
            onClose={() => setShowShortcutsDialog(false)}
          />
        </>
      )}

      {/* Personalized Suggestions Card Modal - Premium Redesign */}
      <Modal
        open={openCardModal !== null}
        onClose={() => setOpenCardModal(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          ...dashboardTheme.modalStyles.backdrop,
        }}
      >
        <Fade in={openCardModal !== null}>
          <Box
            sx={{
              ...dashboardTheme.modalStyles.container,
              width: '95%',
              maxWidth: openCardModal === 'chat-assistant' ? '1400px' : '1200px',
              position: 'relative'
            }}
          >
            {/* Floating Close Button */}
            <IconButton
              onClick={() => setOpenCardModal(null)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: '#1e293b',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e2e8f0',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: '#ffffff',
                  borderColor: '#cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Premium Modal Content */}
            <Box
              sx={{
                ...dashboardTheme.modalStyles.content,
                flexGrow: 1,
                bgcolor: openCardModal === 'chat-assistant' ? '#fff' : dashboardTheme.colors.neutral[50],
                p: openCardModal === 'chat-assistant' ? 0 : 3,
              }}
            >
              {openCardModal === 'personal-medical' && (
                <Box sx={{ height: '100%' }}>
                  <PersonalMedicalInfoPage 
                    inModal={true} 
                    onDataSaved={() => {
                      // Refresh completion percentage and data
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                </Box>
              )}

              {openCardModal === 'diet-plan' && (
                <Box sx={{ height: '100%' }}>
                  <DietPlanDashboard inModal={true} />
                </Box>
              )}

              {openCardModal === 'exercise-plan' && (
                <Box sx={{ height: '100%' }}>
                  <ExercisePlanDashboard inModal={true} />
                </Box>
              )}

              {openCardModal === 'lifestyle-tips' && (
                <Box sx={{ height: '100%' }}>
                  <LifestyleTipsDashboard inModal={true} />
                </Box>
              )}

              {openCardModal === 'chat-assistant' && (
                <Box sx={{ height: '85vh', minHeight: '600px' }}>
                  <ChatAssistant inModal={true} />
                </Box>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default Dashboard;
