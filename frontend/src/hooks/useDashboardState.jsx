import { useState, useRef } from 'react';


/**
 * Custom hook for centralizing all dashboard state management
 * Returns all state variables, setters, and refs needed by the dashboard
 */
const useDashboardState = () => {
  // User and section state
  const [user, setUser] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Disease data state
  const [diseaseData, setDiseaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal/popup state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiagnosisPopup, setShowDiagnosisPopup] = useState(false);
  const [showAssessmentPopup, setShowAssessmentPopup] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [openCardModal, setOpenCardModal] = useState(null);
  
  // Profile and plan data state
  const [personalInfoCompletion, setPersonalInfoCompletion] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [personalInfo, setPersonalInfo] = useState(null);
  const [medicalInfo, setMedicalInfo] = useState(null);
  const [dietHistory, setDietHistory] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState(null);
  const [lifestyleHistory, setLifestyleHistory] = useState(null);
  
  // Assessment state
  const [assessmentSummary, setAssessmentSummary] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Chart and insights preferences (initialized from localStorage)
  const [chartTimeRange, setChartTimeRange] = useState(() => {
    const saved = localStorage.getItem('chartTimeRange');
    return saved ? parseInt(saved, 10) : 14;
  });
  
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('expandedSections');
    return saved ? JSON.parse(saved) : ['Profile Summary', 'Risk Overview', 'Health Metrics'];
  });
  
  const [healthGoals, setHealthGoals] = useState(() => {
    const saved = localStorage.getItem('healthGoals');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Goal dialog state
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', current: 0, unit: '' });
  
  // Day details modal state
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  
  // Keyboard shortcuts state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  
  // Animation state
  const [animatedValues, setAnimatedValues] = useState({ bmi: 0 });
  
  // Refs for scrolling to sections
  const diagnosisRef = useRef(null);
  const labsRef = useRef(null);
  const analyticsRef = useRef(null);
  const plansRef = useRef(null);
  const assessmentRef = useRef(null);
  
  // Profile update state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  
  return {
    // User and section
    user, setUser,
    selectedIndex, setSelectedIndex,
    
    // Disease data
    diseaseData, setDiseaseData,
    loading, setLoading,
    error, setError,
    
    // Modals/popups
    showEditModal, setShowEditModal,
    showDiagnosisPopup, setShowDiagnosisPopup,
    showAssessmentPopup, setShowAssessmentPopup,
    showFeedbackForm, setShowFeedbackForm,
    openCardModal, setOpenCardModal,
    
    // Profile and plans
    personalInfoCompletion, setPersonalInfoCompletion,
    refreshTrigger, setRefreshTrigger,
    personalInfo, setPersonalInfo,
    medicalInfo, setMedicalInfo,
    dietHistory, setDietHistory,
    exerciseHistory, setExerciseHistory,
    lifestyleHistory, setLifestyleHistory,
    
    // Assessment
    assessmentSummary, setAssessmentSummary,
    assessmentLoading, setAssessmentLoading,
    
    // UI
    sidebarOpen, setSidebarOpen,
    mobileOpen, setMobileOpen,
    chartTimeRange, setChartTimeRange,
    expandedSections, setExpandedSections,
    healthGoals, setHealthGoals,
    
    // Goals
    showGoalDialog, setShowGoalDialog,
    showAddGoalDialog, setShowAddGoalDialog,
    newGoal, setNewGoal,
    
    // Day details
    selectedDayData, setSelectedDayData,
    selectedDay, setSelectedDay,
    showDayDetailsModal, setShowDayDetailsModal,
    
    // Export
    exportMenuAnchor, setExportMenuAnchor,
    
    // Shortcuts
    showKeyboardShortcuts, setShowKeyboardShortcuts,
    showShortcutsDialog, setShowShortcutsDialog,
    
    // Animation
    animatedValues, setAnimatedValues,
    
    // Refs
    refs: {
      diagnosisRef,
      labsRef,
      analyticsRef,
      plansRef,
      assessmentRef,
    },
    
    // Profile update
    savingProfile, setSavingProfile,
    profileError, setProfileError,
  };
};

export default useDashboardState;
