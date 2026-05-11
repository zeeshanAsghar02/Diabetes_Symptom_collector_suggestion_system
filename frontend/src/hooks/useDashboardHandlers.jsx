import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../utils/auth';
import axiosInstance from '../utils/axiosInstance';
import { fetchMyDiseaseData, updateUserProfile } from '../utils/api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

/**
 * Custom hook for all event handlers and user interactions
 * Returns handler functions for various dashboard actions
 */
const useDashboardHandlers = ({
  user, setUser,
  selectedIndex,
  expandedSections, setExpandedSections,
  healthGoals, setHealthGoals,
  newGoal, setNewGoal,
  setShowAddGoalDialog,
  setSelectedDayData,
  setShowDayDetailsModal,
  setExportMenuAnchor,
  planUsageAnalytics,
  setShowDiagnosisPopup,
  setShowAssessmentPopup,
  setShowEditModal,
  setLoading,
  setDiseaseData,
  setError,
  savingProfile, setSavingProfile,
  setProfileError,
  diagnosedSections,
}) => {
  const navigate = useNavigate();

  const toggleSection = useCallback((section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, [setExpandedSections]);

  const scrollToSection = useCallback((ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleAddGoal = useCallback((goalData) => {
    if (!goalData.title || !goalData.target) return;
    const goal = {
      id: Date.now(),
      ...goalData,
      target: parseFloat(goalData.target),
      createdAt: new Date().toISOString()
    };
    setHealthGoals(prev => [...prev, goal]);
    setNewGoal({ title: '', target: '', current: 0, unit: '' });
    setShowAddGoalDialog(false);
    toast.success('Goal added successfully!');
  }, [setHealthGoals, setNewGoal, setShowAddGoalDialog]);

  const handleDeleteGoal = useCallback((id) => {
    setHealthGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal removed');
  }, [setHealthGoals]);

  const handleUpdateGoalProgress = useCallback((id, progress) => {
    setHealthGoals(prev => prev.map(g =>
      g.id === id ? { ...g, current: parseFloat(progress) } : g
    ));
  }, [setHealthGoals]);

  const handleChartPointClick = useCallback((data) => {
    if (!data) return;
    setSelectedDayData(data);
    setShowDayDetailsModal(true);
  }, [setSelectedDayData, setShowDayDetailsModal]);

  const handleExportPDF = useCallback(() => {
    toast.info('PDF export feature - Install html2canvas and jsPDF for full implementation');
    setExportMenuAnchor(null);
  }, [setExportMenuAnchor]);

  const handleExportCSV = useCallback(() => {
    if (!planUsageAnalytics?.dailySeries) return;

    const headers = ['Date', 'Diet Calories', 'Carbs (g)', 'Exercise Minutes', 'Exercise Calories'];
    const rows = planUsageAnalytics.dailySeries.map(day => [
      day.label,
      day.dietCalories || 0,
      day.dietCarbs || 0,
      day.exerciseMinutes || 0,
      day.exerciseCalories || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diabetes-insights-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully!');
    setExportMenuAnchor(null);
  }, [planUsageAnalytics, setExportMenuAnchor]);

  const getTrendIcon = (current, previous) => {
    if (!previous || current === previous) return <TrendingFlatIcon fontSize="small" />;
    if (current > previous) return <TrendingUpIcon fontSize="small" color="success" />;
    return <TrendingDownIcon fontSize="small" color="error" />;
  };

  const calculateTrend = (dataKey, index) => {
    if (!planUsageAnalytics?.dailySeries || index === 0) return null;
    const current = planUsageAnalytics.dailySeries[index]?.[dataKey];
    const previous = planUsageAnalytics.dailySeries[index - 1]?.[dataKey];
    if (current == null || previous == null) return null;
    const diff = current - previous;
    const icon = getTrendIcon(current, previous);
    return { diff, icon, current, previous };
  };

  const handleLogout = useCallback(async () => {
    // Clear assessment insight popup flags for next login
    sessionStorage.removeItem('assessmentPopupPostLogin');
    sessionStorage.removeItem('assessmentPopupShown');
    await logout();
    navigate('/signin');
  }, [navigate]);

  const handleDiagnosisAnswer = useCallback(async (answer) => {
    try {
      await axiosInstance.post('/personalized-system/diabetes-diagnosis', {
        diabetes_diagnosed: answer,
      });

      const updatedUser = { ...user, diabetes_diagnosed: answer };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowDiagnosisPopup(false);

      if (answer === 'yes' && diagnosedSections) {
        const idx = diagnosedSections.findIndex((s) => s.label === 'Personalized Suggestions');
        // Note: setSelectedIndex would need to be passed as a prop
        return;
      }

      if (!user?.onboardingCompleted) {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error('Error updating diabetes diagnosis:', err);
      alert('Failed to save your response. Please try again.');
    }
  }, [user, setUser, setShowDiagnosisPopup, diagnosedSections, navigate]);

  const handleAssessmentPopupAnswer = useCallback(async (answerKey) => {
    try {
      if (answerKey === 'diagnosed_diabetic' || answerKey === 'diagnosed_not_diabetic') {
        const diagnosisValue = answerKey === 'diagnosed_diabetic' ? 'yes' : 'no';
        await handleDiagnosisAnswer(diagnosisValue);
        // Diagnosis saved - popup won't show again as user is now diagnosed
      } else if (answerKey === 'not_tested_yet') {
        // User hasn't been tested yet - don't clear the flag, so popup won't show again this session
        // It will show again on next login
      }
      setShowAssessmentPopup(false);
    } catch (err) {
      console.error('Error handling assessment popup answer:', err);
      setShowAssessmentPopup(false);
    }
  }, [handleDiagnosisAnswer, setShowAssessmentPopup]);

  const handleEditDiseaseData = useCallback(() => {
    setShowEditModal(true);
  }, [setShowEditModal]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
  }, [setShowEditModal]);

  const handleDataUpdated = useCallback(() => {
    if (selectedIndex === 1) {
      setLoading(true);
      fetchMyDiseaseData()
        .then((data) => setDiseaseData(data))
        .catch(() => setError('Failed to load disease data.'))
        .finally(() => setLoading(false));
    }
  }, [selectedIndex, setLoading, setDiseaseData, setError]);

  const handleSaveProfile = useCallback(async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setSavingProfile(true);
    setProfileError(null);
    try {
      const payload = { fullName: user.fullName };
      await updateUserProfile(user._id, payload);
    } catch (err) {
      const msg = err?.response?.data?.message || 'You may not have permission to update your profile.';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  }, [user, setSavingProfile, setProfileError]);

  return {
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
  };
};

export default useDashboardHandlers;
