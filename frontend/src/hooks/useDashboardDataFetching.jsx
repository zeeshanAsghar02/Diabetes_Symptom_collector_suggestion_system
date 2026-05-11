import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import { fetchMyDiseaseData, assessDiabetesRisk } from '../utils/api';
import axiosInstance from '../utils/axiosInstance';

/**
 * Custom hook for all data fetching operations and side effects
 * Handles user data, disease data, assessment data, and profile data fetching
 */
const useDashboardDataFetching = ({
  user, setUser,
  currentSection,
  setDiseaseData,
  setLoading,
  setError,
  setShowDiagnosisPopup,
  setShowAssessmentPopup,
  setAssessmentSummary,
  setAssessmentLoading,
  setPersonalInfoCompletion,
  setPersonalInfo,
  setMedicalInfo,
  setDietHistory,
  setExerciseHistory,
  setLifestyleHistory,
  refreshTrigger,
  chartTimeRange,
  expandedSections,
  healthGoals,
  bmiAnalytics,
  setAnimatedValues,
  setSelectedIndex,
  setShowFeedbackForm,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initial user fetch with retry logic
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchUser() {
      try {
        if (retryCount === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log('Fetching user data...');
        const userData = await getCurrentUser();
        console.log('User data received:', userData);
        if (!mounted) return;

        setUser(userData);

        // Assessment insight popup: show on every login if user has been assessed
        const postLoginFlag = sessionStorage.getItem('assessmentPopupPostLogin');
        if (postLoginFlag === 'true') {
          sessionStorage.removeItem('assessmentPopupPostLogin');
          const hasAssessment = !!userData?.last_assessment_at;
          const isDiagnosed = userData?.diabetes_diagnosed === 'yes';
          if (hasAssessment && !isDiagnosed) {
            setShowAssessmentPopup(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        if (!mounted) return;

        if (retryCount < maxRetries && localStorage.getItem('accessToken')) {
          retryCount += 1;
          setTimeout(() => fetchUser(), 500);
        } else if (!localStorage.getItem('accessToken')) {
          navigate('/signin');
        }
      }
    }

    fetchUser();
    return () => { mounted = false; };
  }, [navigate, setUser]);

  // Check if user came from feedback page
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('showFeedback') === 'true') {
      setSelectedIndex(4);
      setShowFeedbackForm(true);
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate, setSelectedIndex, setShowFeedbackForm]);

  // Fetch disease data for Dashboard, Insights and My Disease Data sections
  useEffect(() => {
    if (currentSection === 'Dashboard' || currentSection === 'Insights' || currentSection === 'My Disease Data') {
      setLoading(true);
      setError(null);
      console.log('Fetching disease data for section:', currentSection);
      fetchMyDiseaseData()
        .then((data) => {
          console.log('Disease data received:', data);
          setDiseaseData(data);
        })
        .catch((err) => {
          console.error('Error fetching disease data:', err);
          setError('Failed to load disease data.');
        })
        .finally(() => setLoading(false));
    }
  }, [currentSection, setDiseaseData, setLoading, setError]);

  // Fetch assessment summary for Insights
  useEffect(() => {
    if (!user || currentSection !== 'Insights') return;

    const fetchSummary = async () => {
      try {
        setAssessmentLoading(true);
        
        // Use cached assessment endpoint - never triggers new model execution
        const response = await getLatestDiabetesAssessment();
        
        if (!response || !response.has_assessment) {
          console.log('No assessment found for user');
          setAssessmentSummary(null);
          return;
        }
        
        const result = response?.result || {};
        const features = response?.features || {};

        const symptoms_present = Object.entries(features)
          .filter(([k, v]) => !['Age', 'Gender', 'Obesity'].includes(k) && Number(v) === 1)
          .map(([k]) => k);

        const feature_importance = {};
        if (result.feature_importance && typeof result.feature_importance === 'object') {
          Object.entries(result.feature_importance).forEach(([k, v]) => {
            if (v && typeof v === 'object' && typeof v.importance === 'number') {
              feature_importance[k] = v.importance;
            }
          });
        }

        const normalized = {
          risk_level: (result.risk_level || 'low').charAt(0).toUpperCase() + (result.risk_level || 'low').slice(1),
          probability: Number(result.diabetes_probability || 0),
          confidence: Number(result.confidence || 0),
          symptoms_present,
          feature_importance,
          is_cached: response.is_cached || false,
          assessment_date: response.assessment_date
        };

        setAssessmentSummary(normalized);
      } catch (err) {
        console.error('Failed to fetch assessment summary:', err);
        // If no assessment exists, that's okay - just set to null
        if (err.response?.status === 404) {
          setAssessmentSummary(null);
        } else {
          console.error('Unexpected error fetching assessment:', err);
        }
      } finally {
        setAssessmentLoading(false);
      }
    };

    fetchSummary();
  }, [currentSection, user, setAssessmentSummary, setAssessmentLoading]);

  // Fetch profile and plan data for diagnosed users
  useEffect(() => {
    if (!user || user.diabetes_diagnosed !== 'yes') return;
    if (currentSection !== 'Personalized Suggestions' && currentSection !== 'Dashboard' && currentSection !== 'Insights') return;

    const fetchCompletion = async () => {
      try {
        console.log('Fetching profile and plan data...');
        const [personalRes, medicalRes, dietRes, exerciseRes, lifestyleRes] = await Promise.allSettled([
          axiosInstance.get('/personalized-system/personal-info'),
          axiosInstance.get('/personalized-system/medical-info'),
          axiosInstance.get('/diet-plan/history?limit=30'),
          axiosInstance.get('/exercise-plan/history?limit=30'),
          axiosInstance.get('/lifestyle-tips/history?limit=30'),
        ]);

        if (personalRes.status === 'rejected') {
          console.warn('Failed to fetch personal info:', personalRes.reason);
        }
        if (medicalRes.status === 'rejected') {
          console.warn('Failed to fetch medical info:', medicalRes.reason);
        }
        if (dietRes.status === 'rejected') {
          console.warn('Failed to fetch diet history:', dietRes.reason);
        }
        if (exerciseRes.status === 'rejected') {
          console.warn('Failed to fetch exercise history:', exerciseRes.reason);
        }
        if (lifestyleRes.status === 'rejected') {
          console.warn('Failed to fetch lifestyle history:', lifestyleRes.reason);
        }
        
        console.log('API Responses:', {
          personalRes: personalRes.status === 'fulfilled' ? personalRes.value?.data : undefined,
          medicalRes: medicalRes.status === 'fulfilled' ? medicalRes.value?.data : undefined,
          dietRes: dietRes.status === 'fulfilled' ? dietRes.value?.data : undefined,
          exerciseRes: exerciseRes.status === 'fulfilled' ? exerciseRes.value?.data : undefined,
          lifestyleRes: lifestyleRes.status === 'fulfilled' ? lifestyleRes.value?.data : undefined
        });
        
        const personalFields = ['fullName', 'date_of_birth', 'gender', 'phone_number', 'height', 'weight'];
        const medicalFields = ['diabetes_type', 'diagnosis_date'];
        const personalData = personalRes.status === 'fulfilled' ? (personalRes.value?.data?.data || {}) : {};
        const medicalData = medicalRes.status === 'fulfilled' ? (medicalRes.value?.data?.data || {}) : {};
        
        console.log('Checking completion for fields:', {
          personalFields,
          medicalFields,
          personalData,
          medicalData
        });
        
        const total = personalFields.length + medicalFields.length;
        const completedPersonal = personalFields.filter(field => {
          const value = personalData[field];
          // Handle different value types
          let isComplete = false;
          if (Array.isArray(value)) {
            isComplete = value.length > 0;
          } else {
            isComplete = value !== null && value !== undefined && value !== '';
          }
          console.log(`  Personal field "${field}":`, value, isComplete ? 'COMPLETE' : 'MISSING');
          return isComplete;
        }).length;
        
        const completedMedical = medicalFields.filter(field => {
          const value = medicalData[field];
          // Handle different value types
          let isComplete = false;
          if (Array.isArray(value)) {
            isComplete = value.length > 0;
          } else {
            isComplete = value !== null && value !== undefined && value !== '';
          }
          console.log(`  Medical field "${field}":`, value, isComplete ? 'COMPLETE' : 'MISSING');
          return isComplete;
        }).length;
        
        const completed = completedPersonal + completedMedical;
        
        console.log('Completion calculation:', {
          total,
          completedPersonal,
          completedMedical,
          completed,
          percentage: total ? Math.round((completed / total) * 100) : 0
        });
        
        // Handle different possible response structures for diet/exercise history
        const dietData = dietRes.status === 'fulfilled' ? dietRes.value?.data : undefined;
        const exerciseData = exerciseRes.status === 'fulfilled' ? exerciseRes.value?.data : undefined;
        const lifestyleData = lifestyleRes.status === 'fulfilled' ? lifestyleRes.value?.data : undefined;

        const dietPlans = dietData?.plans || dietData?.data?.plans || dietData?.data || [];
        const exercisePlans = exerciseData?.plans || exerciseData?.data?.plans || exerciseData?.data || [];
        const lifestyleTips = lifestyleData?.history || lifestyleData?.data?.history || lifestyleData?.data || [];
        
        console.log('Extracted Data:', {
          personalData,
          medicalData,
          dietPlans: dietPlans.length,
          exercisePlans: exercisePlans.length,
          lifestyleTips: lifestyleTips.length
        });
        
        setPersonalInfoCompletion(total ? Math.round((completed / total) * 100) : 0);
        setPersonalInfo(personalData);
        setMedicalInfo(medicalData);
        setDietHistory(Array.isArray(dietPlans) ? dietPlans : []);
        setExerciseHistory(Array.isArray(exercisePlans) ? exercisePlans : []);
        setLifestyleHistory(Array.isArray(lifestyleTips) ? lifestyleTips : []);
      } catch (e) {
        console.error('Error fetching profile data:', e);
        // Only treat as a hard failure when we can't compute profile completion.
        // Plan history failures should not lock insights.
        setPersonalInfoCompletion(0);
        setPersonalInfo(null);
        setMedicalInfo(null);
        setDietHistory([]);
        setExerciseHistory([]);
        setLifestyleHistory([]);
      }
    };

    fetchCompletion();
  }, [currentSection, user, refreshTrigger, setPersonalInfoCompletion, setPersonalInfo, setMedicalInfo, setDietHistory, setExerciseHistory, setLifestyleHistory]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('chartTimeRange', chartTimeRange.toString());
  }, [chartTimeRange]);

  useEffect(() => {
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  useEffect(() => {
    localStorage.setItem('healthGoals', JSON.stringify(healthGoals));
  }, [healthGoals]);

  // Animate progress bars
  useEffect(() => {
    if (currentSection === 'Insights' && bmiAnalytics) {
      setTimeout(() => {
        setAnimatedValues(prev => ({ ...prev, bmi: bmiAnalytics.pct }));
      }, 100);
    }
  }, [currentSection, bmiAnalytics, setAnimatedValues]);

  // Keyboard shortcuts (placeholder - full implementation in original)
  useEffect(() => {
    if (currentSection !== 'Insights') return;
    // Keyboard event handler would go here
  }, [currentSection]);

  return null; // This hook only handles side effects
};

export default useDashboardDataFetching;
