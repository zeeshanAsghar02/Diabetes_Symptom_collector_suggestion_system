import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Fade,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Divider,
  Popover,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Assessment as AssessmentIcon,
  Login,
  Visibility,
  HelpOutline,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import { getCurrentUser } from '../utils/auth';
import QuestionList from '../components/Onboarding/QuestionList';
import AuthBackground from '../components/Common/AuthBackground';
import { useTheme } from '../contexts/useThemeContext';

const SymptomAssessment = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptomIndex, setCurrentSymptomIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [completedSymptoms, setCompletedSymptoms] = useState(new Set());
  const [symptomCompletionStatus, setSymptomCompletionStatus] = useState({});
  const [userAge, setUserAge] = useState(null);
  const [userGender, setUserGender] = useState(null);
  const [canProceed, setCanProceed] = useState(false);
  const [helpInfoOpen, setHelpInfoOpen] = useState(false);
  const [whyLanguage, setWhyLanguage] = useState('ur');
  const [questionProgress, setQuestionProgress] = useState(0);
  const [questionProgressMeta, setQuestionProgressMeta] = useState({ answered: 0, total: 0 });
  const questionListRef = useRef();

  useEffect(() => {
    console.log('🔍 ========== SYMPTOM ASSESSMENT MOUNTED ==========');
    console.log('📦 Checking sessionStorage...');
    console.log('  returnToSymptomAssessment:', sessionStorage.getItem('returnToSymptomAssessment'));
    console.log('  answersSavedAfterLogin:', sessionStorage.getItem('answersSavedAfterLogin'));
    console.log('  pendingOnboardingAnswers:', sessionStorage.getItem('pendingOnboardingAnswers'));
    console.log('  onboardingState:', sessionStorage.getItem('onboardingState'));
    console.log('  accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'NOT FOUND');
    
    checkLoginAndFetchData();
    
    // Check if user just logged in and should see the dialog
    const shouldShowDialog = sessionStorage.getItem('returnToSymptomAssessment');
    const answersSaved = sessionStorage.getItem('answersSavedAfterLogin');
    
    console.log('\n🔍 Checking if should show login dialog...');
    console.log('  shouldShowDialog:', shouldShowDialog);
    console.log('  answersSaved:', answersSaved);
    
    if (shouldShowDialog === 'true') {
      console.log('✅ Found returnToSymptomAssessment flag');
      sessionStorage.removeItem('returnToSymptomAssessment');
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('✅ User has token, checking if answers were saved...');
        // User just logged in
        if (answersSaved === 'true') {
          // Answers were just saved, wait a bit then refetch data
          sessionStorage.removeItem('answersSavedAfterLogin');
          console.log('🔄 Answers just saved, waiting before refetch...');
          setTimeout(async () => {
            console.log('🔄 Refetching symptom data after login...');
            await fetchAllSymptoms();
            await fetchUserAnsweredQuestions();
            console.log('✅ Data refetched, showing login dialog');
            setShowLoginDialog(true);
          }, 1000); // Wait 1 second for database writes to complete
        } else {
          console.log('ℹ️  No answers saved flag, showing dialog immediately');
          // No answers saved, just show dialog
          setShowLoginDialog(true);
        }
      } else {
        console.log('⚠️  No token found despite returnToSymptomAssessment flag');
      }
    } else {
      console.log('ℹ️  No returnToSymptomAssessment flag found');
    }
    console.log('🔍 ========== END MOUNT CHECK ==========\n');
  }, []);

  const checkLoginAndFetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Allow unauthenticated users to continue with assessment
        setIsLoggedIn(false);
        // Don't show login dialog yet - only after completing questions
        await fetchAllSymptoms();
        setLoading(false);
        return;
      }
      
      // Only call getCurrentUser if token exists
      try {
        const user = await getCurrentUser();
        setIsLoggedIn(true);
        
        console.log('User data fetched:', user);
        console.log('Date of birth:', user?.date_of_birth);
        console.log('Gender:', user?.gender);
        
        // Calculate age from user's date of birth if available
        if (user?.date_of_birth) {
          const dob = new Date(user.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          
          // Calculate months
          const dobMonth = dob.getMonth();
          const dobDay = dob.getDate();
          const todayMonth = today.getMonth();
          const todayDay = today.getDate();
          
          let months = todayMonth - dobMonth;
          if (todayDay < dobDay) {
            months--;
          }
          if (months < 0) {
            months += 12;
          }
          
          // Format as "X years and Y months"
          const ageStr = months > 0 ? `${age} years and ${months} months` : `${age} years`;
          console.log('Calculated age:', ageStr);
          setUserAge(ageStr);
        }
        
        // Set user's gender if available
        if (user?.gender) {
          console.log('Setting gender:', user.gender);
          setUserGender(user.gender);
        }
        
        await fetchAllSymptoms();
        await fetchUserAnsweredQuestions();
      } catch (err) {
        // If getCurrentUser fails, treat as unauthenticated
        console.error('User authentication failed:', err);
        setIsLoggedIn(false);
        await fetchAllSymptoms();
        setLoading(false);
      }
    } catch (err) {
      console.error('Login check failed:', err);
      setIsLoggedIn(false);
      // Allow unauthenticated users to continue
      await fetchAllSymptoms();
      setLoading(false);
    }
  };

  const fetchAllSymptoms = async () => {
    try {
      setLoading(true);
      // Fetch all diseases first
      const diseaseRes = await axiosInstance.get('/diseases/public');
      let diseaseData = diseaseRes.data;
      if (!Array.isArray(diseaseData) && Array.isArray(diseaseData?.data)) {
        diseaseData = diseaseData.data;
      }

      const allSymptoms = [];

      // For each disease, fetch its symptoms and flatten into a single list
      if (Array.isArray(diseaseData)) {
        const symptomPromises = diseaseData.map(async (disease) => {
          try {
            const res = await axiosInstance.get(`/symptoms/public/${disease._id}`);
            const data = res.data?.data || [];
            data.forEach((symptom) => {
              allSymptoms.push({
                ...symptom,
                _diseaseName: disease.name,
              });
            });
          } catch (err) {
            console.error('Error fetching symptoms for disease', disease._id, err);
          }
        });

        await Promise.all(symptomPromises);
      }

      setSymptoms(allSymptoms);
    } catch (err) {
      console.error('Error fetching all symptoms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnsweredQuestions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const response = await axiosInstance.get('/users/my-disease-data');
      const data = response.data;
      if (data.success && data.data && data.data.symptoms) {
        const completionStatus = {};
        const completed = new Set();
        data.data.symptoms.forEach(symptom => {
          const symptomQuestions = symptom.questions || [];
          const answeredCount = symptomQuestions.length;
          const isCompleted = answeredCount > 0;
          const symptomKey = symptom.name?.toLowerCase().trim();
          completionStatus[symptomKey] = {
            answered: answeredCount,
            total: answeredCount,
            completed: isCompleted,
            symptomId: symptom._id
          };
          if (isCompleted) {
            completed.add(symptom._id);
          }
        });
        setSymptomCompletionStatus(completionStatus);
        setCompletedSymptoms(completed);
      }
    } catch (err) {
      console.error('Error fetching answered questions:', err);
    }
  };

  const handleHelpInfoOpen = (event) => {
    setHelpInfoOpen(true);
  };

  const handleHelpInfoClose = () => {
    setHelpInfoOpen(false);
  };

  const handleNext = async () => {

    // Auto-save answers before proceeding (only for logged in users)
    if (questionListRef.current && activeStep === 0 && isLoggedIn) {
      try {
        await questionListRef.current.saveAll();
      } catch (error) {
        console.error('Error saving answers:', error);
        return; // Don't proceed if save fails
      }
    }

    const shouldFinishCheckIn = activeStep === 0 && (
      isAssessmentComplete ||
      questionProgress >= 100 ||
      (completedSymptoms.size >= symptoms.length && symptoms.length > 0)
    );

    if (shouldFinishCheckIn) {
      if (!isLoggedIn) {
        sessionStorage.setItem('returnToSymptomAssessment', 'true');
        setShowLoginDialog(true);
      } else {
        setActiveStep(1);
      }
    } else if (activeStep === 0 && currentSymptomIndex < symptoms.length - 1) {
      setCurrentSymptomIndex((prev) => prev + 1);
      setCanProceed(false); // Reset for next symptom
      setQuestionProgress(0);
      setQuestionProgressMeta({ answered: 0, total: 0 });
    } else if (activeStep === 0 && currentSymptomIndex === symptoms.length - 1) {
      // Completed all questions — save and move to summary review
      if (!isLoggedIn) {
        // Store redirect info in sessionStorage before showing login dialog
        sessionStorage.setItem('returnToSymptomAssessment', 'true');
        // Show login dialog for unauthenticated users
        setShowLoginDialog(true);
      } else {
        setActiveStep(1); // Show summary review screen
      }
    } else if (activeStep === 1) {
      // User confirmed their answers — proceed to assessment
      handleViewAssessment();
    }
  };

  const handleAnswersChange = (answers, questions) => {
    const answeredCount = questions.filter((q) => {
      const answer = answers[q._id];
      if (Array.isArray(answer)) return answer.length > 0;
      if (typeof answer === 'number') return true;
      return answer !== undefined && answer !== null && answer.toString().trim() !== '';
    }).length;

    const totalQuestions = questions.length;
    const currentCategoryProgress = totalQuestions > 0 ? answeredCount / totalQuestions : 0;
    const completedCategoryIds = new Set(completedSymptoms);
    const currentSymptomId = symptoms[currentSymptomIndex]?._id;

    if (currentSymptomId && currentCategoryProgress >= 1) {
      completedCategoryIds.add(currentSymptomId);
    } else if (currentSymptomId && !completedSymptoms.has(currentSymptomId)) {
      completedCategoryIds.delete(currentSymptomId);
    }

    const categoryProgressTotal = symptoms.reduce((sum, symptom) => {
      if (completedCategoryIds.has(symptom._id)) return sum + 1;
      if (symptom._id === currentSymptomId) return sum + currentCategoryProgress;
      return sum;
    }, 0);
    const totalCategories = symptoms.length || 1;
    const progressValue = Math.min(100, Math.round((categoryProgressTotal / totalCategories) * 100));

    setQuestionProgress(progressValue);
    setQuestionProgressMeta({
      answered: Math.min(totalCategories, Math.floor(categoryProgressTotal)),
      total: totalCategories,
    });

    if (currentSymptomId && currentCategoryProgress >= 1 && !completedSymptoms.has(currentSymptomId)) {
      setCompletedSymptoms((prev) => {
        const next = new Set(prev);
        next.add(currentSymptomId);
        return next;
      });
    }

    // Check if all questions have been answered
    // Questions are considered answered if they have a value in answers object
    const allAnswered = questions.every((q) => {
      const answer = answers[q._id];
      return answer !== undefined && answer !== null && answer.toString().trim() !== '';
    });
    console.log('All answered:', allAnswered, 'Total questions:', questions.length, 'Answers:', Object.keys(answers).length);
    
    // ✅ FIX: Defer state update to avoid "Cannot update component during render" error
    setTimeout(() => {
      setCanProceed(allAnswered);
    }, 0);
    
    // 🔥 CRITICAL FIX: ACCUMULATE answers across all symptoms for unauthenticated users
    if (!isLoggedIn && Object.keys(answers).length > 0) {
      try {
        // Get existing answers from sessionStorage
        const existingAnswersJson = sessionStorage.getItem('pendingOnboardingAnswers');
        const existingAnswers = existingAnswersJson ? JSON.parse(existingAnswersJson) : [];
        
        // Convert new answers to array format
        const newAnswersArray = Object.entries(answers).map(([questionId, answerText]) => ({
          questionId,
          answerText: typeof answerText === 'object' ? JSON.stringify(answerText) : answerText.toString()
        }));
        
        // Merge: Remove duplicates (same questionId), keep latest answer
        const answerMap = new Map();
        
        // Add existing answers first
        existingAnswers.forEach(ans => {
          answerMap.set(ans.questionId, ans);
        });
        
        // Add/update with new answers
        newAnswersArray.forEach(ans => {
          answerMap.set(ans.questionId, ans);
        });
        
        // Convert back to array
        const mergedAnswers = Array.from(answerMap.values());
        
        sessionStorage.setItem('pendingOnboardingAnswers', JSON.stringify(mergedAnswers));
        console.log('💾 Accumulated answers in sessionStorage:', mergedAnswers.length, 'total answers');
      } catch (error) {
        console.error('❌ Failed to save answers to sessionStorage:', error);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 0 && currentSymptomIndex > 0) {
      setCurrentSymptomIndex((prev) => prev - 1);
      setQuestionProgress(0);
      setQuestionProgressMeta({ answered: 0, total: 0 });
    }
  };

  const handleViewAssessment = () => {
    // Clear all temporary onboarding storage when moving to assessment
    sessionStorage.removeItem('pendingOnboardingAnswers');
    sessionStorage.removeItem('onboardingState');
    sessionStorage.removeItem('returnToSymptomAssessment');
    sessionStorage.removeItem('answersSavedAfterLogin');
    localStorage.removeItem('onboardingState');
    localStorage.removeItem('redirectAfterLogin');
    console.log('🧹 Cleared all temporary storage before navigating to assessment');

    navigate('/assessment');
  };
    
  const handleLoginRedirect = () => {
    navigate('/signin?returnTo=symptom-assessment');
  };

  const isSymptomCompleted = (symptomId) => {
    return completedSymptoms.has(symptomId);
  };

  const getUrduWhyItMatters = (symptomName = '') => {
    const normalized = symptomName.toLowerCase();

    if (normalized.includes('weight')) {
      return [
        'اچانک وزن کم ہونا جسم میں انسولین کے مسئلے یا شوگر بڑھنے کی علامت ہو سکتا ہے۔',
        'وزن بڑھنا یا پیٹ کے گرد چربی ذیابیطس کے خطرے کو بڑھا سکتی ہے۔',
        'یہ معلومات خوراک، ورزش اور روزمرہ عادات کی بہتر رہنمائی کے لیے استعمال ہوتی ہے۔',
      ];
    }
    if (normalized.includes('urination') || normalized.includes('urine')) {
      return [
        'بار بار پیشاب آنا اکثر خون میں شوگر زیادہ ہونے کی اہم علامت ہو سکتی ہے۔',
        'رات کو بار بار اٹھ کر پیشاب جانا جسم میں پانی کی کمی کا خطرہ بڑھا سکتا ہے۔',
        'اس سے ہمیں سمجھ آتا ہے کہ آپ کے شوگر لیول پر مزید توجہ کی ضرورت ہے یا نہیں۔',
      ];
    }
    if (normalized.includes('thirst') || normalized.includes('hydration')) {
      return [
        'بہت زیادہ پیاس لگنا شوگر بڑھنے اور جسم سے پانی کم ہونے کی علامت ہو سکتی ہے۔',
        'منہ خشک رہنا یا پانی پینے کے بعد بھی پیاس رہنا ذیابیطس screening میں اہم ہے۔',
        'یہ جواب hydration، خوراک اور شوگر کنٹرول کے خطرے کو سمجھنے میں مدد دیتا ہے۔',
      ];
    }
    if (normalized.includes('energy') || normalized.includes('fatigue') || normalized.includes('tired')) {
      return [
        'مسلسل تھکن اس بات کی علامت ہو سکتی ہے کہ جسم شوگر کو توانائی میں صحیح استعمال نہیں کر رہا۔',
        'کھانے کے بعد نیند یا کمزوری glucose spikes سے متعلق ہو سکتی ہے۔',
        'اس سے Diavise آپ کے لیے خوراک، نیند اور activity کے بہتر مشورے دے سکتا ہے۔',
      ];
    }
    if (normalized.includes('appetite') || normalized.includes('hunger')) {
      return [
        'بہت زیادہ بھوک لگنا اس بات سے جڑا ہو سکتا ہے کہ جسم کو cells تک توانائی نہیں مل رہی۔',
        'بھوک میں اچانک کمی یا cravings شوگر کے اتار چڑھاؤ سے متعلق ہو سکتی ہیں۔',
        'یہ معلومات meal timing اور بہتر diet plan بنانے میں مدد کرتی ہے۔',
      ];
    }
    if (normalized.includes('infection') || normalized.includes('yeast') || normalized.includes('skin')) {
      return [
        'بار بار infection ہونا بعض اوقات خون میں شوگر زیادہ رہنے کی وجہ سے ہوتا ہے۔',
        'جلد، urinary یا yeast infection ذیابیطس کے risk کو سمجھنے میں اہم اشارہ دے سکتے ہیں۔',
        'یہ معلومات بروقت احتیاط اور ڈاکٹر سے رابطے کا فیصلہ کرنے میں مدد دیتی ہے۔',
      ];
    }
    if (normalized.includes('vision') || normalized.includes('eye')) {
      return [
        'نظر دھندلی ہونا کبھی کبھار شوگر لیول کے بدلنے سے ہو سکتا ہے۔',
        'آنکھوں میں دباؤ، دھندلا پن یا بار بار نمبر بدلنا diabetes screening میں اہم ہے۔',
        'یہ جواب آنکھوں کی حفاظت اور follow-up کی ضرورت کو سمجھنے میں مدد دیتا ہے۔',
      ];
    }
    if (normalized.includes('wound') || normalized.includes('healing')) {
      return [
        'زخم دیر سے بھرنا ذیابیطس میں healing اور blood circulation کے مسئلے کی علامت ہو سکتا ہے۔',
        'پاؤں یا جلد کے چھوٹے زخم بھی diabetes care میں سنجیدگی سے دیکھے جاتے ہیں۔',
        'یہ معلومات احتیاط، foot care اور ڈاکٹر سے follow-up کے لیے مددگار ہے۔',
      ];
    }
    if (normalized.includes('bio')) {
      return [
        'عمر، جنس، قد اور وزن ذیابیطس کے risk score کو بہتر سمجھنے کے لیے بنیادی معلومات ہیں۔',
        'Family history یا جسمانی حالت risk assessment کو زیادہ accurate بناتی ہے۔',
        'یہ معلومات Diavise کو آپ کے حساب سے personalized guidance دینے میں مدد دیتی ہے۔',
      ];
    }

    return [
      'یہ سوال آپ کی روزمرہ علامات کو بہتر سمجھنے کے لیے ہے۔',
      'اس سے Diavise ذیابیطس کے ممکنہ خطرے اور عادات کے pattern کو identify کرتا ہے۔',
      'آپ کے جواب کی بنیاد پر اگلا قدم زیادہ واضح اور personalized بنایا جاتا ہے۔',
    ];
  };

  const getEnglishWhyItMatters = (symptomName = '') => {
    const normalized = symptomName.toLowerCase();

    if (normalized.includes('weight')) {
      return [
        'Sudden weight loss can signal insulin or high blood sugar concerns.',
        'Weight gain, especially around the waist, can increase diabetes risk.',
        'This helps Diavise personalize nutrition, activity, and lifestyle guidance.',
      ];
    }
    if (normalized.includes('urination') || normalized.includes('urine')) {
      return [
        'Frequent urination can be an early sign of high blood sugar.',
        'Waking up at night to urinate may increase dehydration risk.',
        'Your answer helps identify whether your glucose control needs more attention.',
      ];
    }
    if (normalized.includes('thirst') || normalized.includes('hydration')) {
      return [
        'Excessive thirst may happen when blood sugar is high and the body loses fluids.',
        'Dry mouth or constant thirst is important in diabetes screening.',
        'This helps assess hydration, diet, and glucose-control risk.',
      ];
    }
    if (normalized.includes('energy') || normalized.includes('fatigue') || normalized.includes('tired')) {
      return [
        'Ongoing fatigue may mean your body is not using glucose effectively for energy.',
        'Sleepiness after meals can be linked with glucose spikes.',
        'This helps Diavise suggest better food, sleep, and activity habits.',
      ];
    }
    if (normalized.includes('appetite') || normalized.includes('hunger')) {
      return [
        'Increased hunger may happen when cells are not getting enough usable energy.',
        'Sudden appetite changes or cravings can relate to blood sugar swings.',
        'This supports better meal timing and diet-plan recommendations.',
      ];
    }
    if (normalized.includes('infection') || normalized.includes('yeast') || normalized.includes('skin')) {
      return [
        'Repeated infections can sometimes happen when blood sugar remains high.',
        'Skin, urinary, or yeast infections are useful clues in diabetes risk screening.',
        'This helps decide when prevention steps or medical follow-up may be needed.',
      ];
    }
    if (normalized.includes('vision') || normalized.includes('eye')) {
      return [
        'Blurry vision can sometimes happen when blood sugar levels change.',
        'Eye pressure, vision changes, or frequent prescription changes matter in screening.',
        'This helps identify when eye-care follow-up may be important.',
      ];
    }
    if (normalized.includes('wound') || normalized.includes('healing')) {
      return [
        'Slow wound healing may point to diabetes-related circulation or healing concerns.',
        'Foot or skin wounds need careful attention in diabetes care.',
        'This helps guide prevention, foot care, and doctor follow-up.',
      ];
    }
    if (normalized.includes('bio')) {
      return [
        'Age, gender, height, and weight help estimate diabetes risk more accurately.',
        'Family history and body profile make risk assessment more personalized.',
        'This helps Diavise tailor guidance to your health background.',
      ];
    }

    return [
      'This question helps us understand your daily symptoms more clearly.',
      'Diavise uses it to identify diabetes risk patterns and lifestyle factors.',
      'Your answer helps make the next step more personal and easier to follow.',
    ];
  };

  const steps = ['Questions', 'Summary', 'Results'];

  const currentSymptom = symptoms[currentSymptomIndex];
  const completedCategoryCount = completedSymptoms.size;
  const isAssessmentComplete = symptoms.length > 0 && completedSymptoms.size >= symptoms.length;
  const whyItMattersPoints = currentSymptom
    ? whyLanguage === 'ur'
      ? getUrduWhyItMatters(currentSymptom.name)
      : getEnglishWhyItMatters(currentSymptom.name)
    : [];

  const pageBg = isDarkMode
    ? 'linear-gradient(160deg, #0b1220 0%, #12182a 42%, #0a0f18 100%)'
    : 'linear-gradient(165deg, #ffffff 0%, #f8fafc 38%, #f0f9ff 100%)';

  return (
    <Box
      component="main"
      minHeight="100vh"
      sx={{
        background: pageBg,
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      <AuthBackground />
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Fade in timeout={500}>
          <Box textAlign="center" mb={{ xs: 2.5, md: 3 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 60, md: 66 },
                height: { xs: 60, md: 66 },
                borderRadius: 4,
                mb: 1.6,
                color: '#22D3EE',
                border: '1px solid rgba(34,211,238,0.35)',
                background: 'linear-gradient(145deg, rgba(34,211,238,0.12), rgba(163,230,53,0.1))',
              }}
            >
              <AssessmentIcon sx={{ fontSize: { xs: 40, md: 44 } }} />
            </Box>
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                mb: 1,
                fontSize: { xs: '1.55rem', md: '2.1rem' },
                letterSpacing: '-0.03em',
                color: 'text.primary',
              }}
            >
              Calm symptom check-in
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 620,
                mx: 'auto',
                lineHeight: 1.65,
                fontSize: { xs: '0.92rem', md: '1rem' },
                fontWeight: 400,
              }}
            >
              A few clear questions at a time. Pause anytime—your answers stay on this step until you move on. Nothing here replaces care from your clinician.
            </Typography>
          </Box>
        </Fade>

        {/* Main Assessment Card */}
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              position: 'relative',
              borderRadius: { xs: 3, md: 4 },
              background: (theme) => alpha(theme.palette.background.paper, isDarkMode ? 0.55 : 0.82),
              backdropFilter: 'blur(20px) saturate(160%)',
              border: `1px solid ${alpha('#0EA5E9', isDarkMode ? 0.18 : 0.13)}`,
              boxShadow: isDarkMode ? `0 26px 58px ${alpha('#000', 0.36)}` : `0 24px 60px ${alpha('#0f172a', 0.08)}`,
              minHeight: 'auto',
            }}
          >
            {/* Progress */}
            <Box sx={{ mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.25} flexWrap="wrap" gap={1}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ letterSpacing: '0.02em' }}>
                   {activeStep === 0
                     ? `Completed ${questionProgressMeta.answered} of ${questionProgressMeta.total} topics`
                     : 'Finished'}
                </Typography>
                <Chip
                  label={`${questionProgress}%`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: alpha('#22D3EE', isDarkMode ? 0.14 : 0.1),
                    color: isDarkMode ? '#67E8F9' : '#0e7490',
                    border: `1px solid ${alpha('#22D3EE', 0.25)}`,
                  }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={questionProgress}
                sx={{
                  height: 6,
                  borderRadius: 99,
                  bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, #0EA5E9 0%, #22D3EE 40%, #84CC16 100%)',
                  },
                }}
              />
            </Box>

            {/* Lightweight journey hint (less clinical than a heavy stepper) */}
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 3 }} flexWrap="wrap">
              {steps.map((label, index) => (
                <React.Fragment key={label}>
                  {index > 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ px: 0.5 }}>
                      →
                    </Typography>
                  )}
                  <Chip
                    label={label}
                    size="small"
                    variant={index === activeStep ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: index === activeStep ? 700 : 500,
                      borderRadius: 2,
                      textTransform: 'none',
                      ...(index === activeStep && {
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 50%, #65A30D 100%)',
                        color: '#fff',
                        border: 'none',
                      }),
                    }}
                  />
                </React.Fragment>
              ))}
            </Stack>

            <Alert
              severity="info"
              icon={false}
              sx={{
                mb: 3,
                borderRadius: 2,
                py: 1.25,
                bgcolor: alpha('#22D3EE', isDarkMode ? 0.08 : 0.06),
                color: 'text.secondary',
                border: `1px solid ${alpha('#22D3EE', 0.15)}`,
                '& .MuiAlert-message': { width: '100%' },
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                <strong style={{ color: 'inherit', fontWeight: 700 }}>Take your time.</strong> Answer in your own words where it helps. You can use Back to change a previous topic before finishing.
              </Typography>
            </Alert>

            {/* Step Content */}
            <Box sx={{ minHeight: 0 }}>
              {activeStep === 0 && currentSymptom && (
                <Grid container spacing={3} alignItems="flex-start">
                  <Grid item xs={12} md={3.5}>
                    <Paper
                      elevation={0}
                      sx={{
                        height: { xs: 'auto', md: 'fit-content' },
                        p: { xs: 1.75, md: 2 },
                        borderRadius: 3.5,
                        background: (theme) => alpha(theme.palette.background.paper, isDarkMode ? 0.5 : 0.86),
                        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.42)}`,
                        boxShadow: isDarkMode ? `0 18px 40px ${alpha('#000', 0.2)}` : `0 16px 38px ${alpha('#0f172a', 0.055)}`,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label="Question categories"
                          size="small"
                          sx={{
                            mb: 1.5,
                            fontWeight: 700,
                            borderRadius: 2,
                            bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.1),
                            color: isDarkMode ? '#67E8F9' : '#0e7490',
                            border: `1px solid ${alpha('#22D3EE', 0.22)}`,
                          }}
                        />
                        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                          Categories
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>
                          Pick a category to load its related questions in the main panel.
                        </Typography>
                      </Box>

                      <Stack spacing={1.1}>
                        {symptoms.map((symptom, index) => {
                          const isActive = index === currentSymptomIndex;
                          const isDone = completedSymptoms.has(symptom._id);
                          return (
                            <Paper
                              key={symptom._id}
                              component="button"
                              type="button"
                              onClick={() => {
                                setCurrentSymptomIndex(index);
                                setCanProceed(false);
                                setHelpInfoOpen(false);
                                setQuestionProgress(0);
                                setQuestionProgressMeta({ answered: 0, total: 0 });
                              }}
                              elevation={0}
                              sx={{
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                p: 1.45,
                                borderRadius: 2.4,
                                border: (theme) => `1px solid ${isActive ? alpha('#22D3EE', 0.45) : alpha(theme.palette.divider, 0.55)}`,
                                background: (theme) => isActive
                                  ? `linear-gradient(135deg, ${alpha('#22D3EE', isDarkMode ? 0.16 : 0.14)} 0%, ${alpha('#65A30D', isDarkMode ? 0.12 : 0.1)} 100%)`
                                  : alpha(theme.palette.background.paper, isDarkMode ? 0.42 : 0.8),
                                boxShadow: isActive
                                  ? `0 14px 30px ${alpha('#0EA5E9', 0.16)}`
                                  : 'none',
                                transition: 'all 0.22s ease',
                                color: 'inherit',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  borderColor: alpha('#22D3EE', 0.35),
                                  boxShadow: `0 10px 24px ${alpha('#0f172a', 0.08)}`,
                                },
                                '&:focus-visible': {
                                  outline: `3px solid ${alpha('#22D3EE', 0.28)}`,
                                  outlineOffset: 2,
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                    {symptom.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    {symptom._diseaseName || 'Diabetes care'}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={isDone ? 'Done' : isActive ? 'Open' : 'Pending'}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    bgcolor: isDone ? alpha('#84CC16', 0.12) : isActive ? alpha('#22D3EE', 0.12) : alpha('#94a3b8', 0.1),
                                    color: isDone ? '#4D7C0F' : isActive ? '#0e7490' : 'text.secondary',
                                  }}
                                />
                              </Box>
                            </Paper>
                          );
                        })}
                      </Stack>

                      <Box sx={{ mt: 2.5, p: 1.75, borderRadius: 2.5, background: alpha('#22D3EE', isDarkMode ? 0.08 : 0.06), border: `1px solid ${alpha('#22D3EE', 0.12)}` }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.08em' }}>
                          PROGRESS
                        </Typography>
                        <Typography variant="h6" fontWeight={900} sx={{ mt: 0.4 }}>
                          {completedCategoryCount} of {symptoms.length} completed
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={8.5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Fade in timeout={500} key={currentSymptomIndex}>
                      <Paper
                        elevation={0}
                        sx={{
                          width: '100%',
                          maxWidth: 780,
                          height: 'fit-content',
                          p: { xs: 2, md: 3 },
                          borderRadius: 3.5,
                          background: (theme) => alpha(theme.palette.background.paper, isDarkMode ? 0.55 : 0.88),
                          backdropFilter: 'blur(20px) saturate(160%)',
                          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.42)}`,
                          boxShadow: isDarkMode ? `0 18px 40px ${alpha('#000', 0.2)}` : `0 16px 38px ${alpha('#0f172a', 0.055)}`,
                        }}
                      >
                        <Box mb={3}>
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1.25} flexWrap="wrap" mb={1}>
                            <Chip
                              label={`Category ${currentSymptomIndex + 1} of ${symptoms.length}`}
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                px: 1,
                                borderRadius: 2,
                                bgcolor: alpha('#22D3EE', isDarkMode ? 0.12 : 0.1),
                                color: isDarkMode ? '#67E8F9' : '#0e7490',
                                border: `1px solid ${alpha('#22D3EE', 0.22)}`,
                              }}
                            />
                            <Typography
                              variant="overline"
                              sx={{
                                letterSpacing: '0.12em',
                                color: 'text.secondary',
                                fontWeight: 700,
                              }}
                            >
                              {currentSymptom._diseaseName || 'Diabetes care'}
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2, opacity: 0.4 }} />
                          <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} flexWrap="wrap">
                            <Typography
                              variant="h5"
                              fontWeight={800}
                              sx={{
                                fontSize: { xs: '1.2rem', md: '1.5rem' },
                                letterSpacing: '-0.02em',
                                color: 'text.primary',
                              }}
                            >
                              {currentSymptom.name}
                            </Typography>
                            {currentSymptom.description && (
                              <>
                                <Button
                                  onClick={handleHelpInfoOpen}
                                  startIcon={<HelpOutline />}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    borderRadius: 1.75,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    borderColor: alpha('#22D3EE', 0.35),
                                    color: isDarkMode ? '#67E8F9' : '#0e7490',
                                  }}
                                >
                                  What is this about?
                                </Button>
                                <Popover
                                  open={helpInfoOpen}
                                  anchorEl={null}
                                  onClose={handleHelpInfoClose}
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                  PaperProps={{
                                    sx: {
                                      p: 3,
                                      maxWidth: 500,
                                      maxHeight: '70vh',
                                      overflow: 'auto',
                                      borderRadius: 3,
                                      boxShadow: (theme) => theme.shadows[12],
                                    },
                                  }}
                                >
                                  <Box display="flex" alignItems="center" mb={2}>
                                    <HelpOutline color="primary" sx={{ mr: 1, fontSize: 28 }} />
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                      {currentSymptom.name}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.9, whiteSpace: 'pre-line' }}
                                  >
                                    {currentSymptom.description}
                                  </Typography>
                                  <Box mt={3} display="flex" justifyContent="flex-end">
                                    <Button
                                      onClick={handleHelpInfoClose}
                                      variant="contained"
                                      size="small"
                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                                    >
                                      Got it!
                                    </Button>
                                  </Box>
                                </Popover>
                              </>
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            mb: 2.5,
                            p: { xs: 1.6, md: 1.9 },
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.5,
                            bgcolor: alpha('#0EA5E9', isDarkMode ? 0.1 : 0.055),
                            border: `1px solid ${alpha('#0EA5E9', 0.14)}`,
                          }}
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 2,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              color: isDarkMode ? '#67E8F9' : '#0e7490',
                              bgcolor: alpha('#22D3EE', 0.12),
                            }}
                          >
                            <HelpOutline sx={{ fontSize: 19 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" gap={1.2} sx={{ mb: 0.8 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                Why this matters
                              </Typography>
                              <ToggleButtonGroup
                                exclusive
                                size="small"
                                value={whyLanguage}
                                onChange={(_, nextLanguage) => {
                                  if (nextLanguage) setWhyLanguage(nextLanguage);
                                }}
                                aria-label="Why this matters language"
                                sx={{
                                  p: 0.25,
                                  borderRadius: 999,
                                  bgcolor: alpha('#0EA5E9', 0.08),
                                  '& .MuiToggleButton-root': {
                                    border: 0,
                                    px: 1.25,
                                    py: 0.35,
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    fontSize: '0.72rem',
                                    color: 'text.secondary',
                                    '&.Mui-selected': {
                                      bgcolor: '#0EA5E9',
                                      color: '#fff',
                                      '&:hover': { bgcolor: '#0284C7' },
                                    },
                                  },
                                }}
                              >
                                <ToggleButton value="ur" aria-label="Show Urdu explanation">اردو</ToggleButton>
                                <ToggleButton value="en" aria-label="Show English explanation">English</ToggleButton>
                              </ToggleButtonGroup>
                            </Stack>
                            <Box
                              component="ul"
                              dir={whyLanguage === 'ur' ? 'rtl' : 'ltr'}
                              lang={whyLanguage === 'ur' ? 'ur' : 'en'}
                              sx={{
                                m: 0,
                                pr: whyLanguage === 'ur' ? 2.2 : 0,
                                pl: whyLanguage === 'ur' ? 0 : 2.2,
                                color: 'text.secondary',
                                textAlign: whyLanguage === 'ur' ? 'right' : 'left',
                                fontFamily: whyLanguage === 'ur'
                                  ? '"Noto Nastaliq Urdu", "Noto Naskh Arabic", "Segoe UI", Arial, sans-serif'
                                  : 'inherit',
                              }}
                            >
                              {whyItMattersPoints.map((point) => (
                                <Typography
                                  key={point}
                                  component="li"
                                  variant="body2"
                                  sx={{
                                    mb: 0.65,
                                    lineHeight: 1.9,
                                    fontSize: '0.92rem',
                                    '&::marker': {
                                      color: '#0EA5E9',
                                    },
                                  }}
                                >
                                  {point}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </Box>

                        <Divider sx={{ mb: 2, opacity: 0.35 }} />
                        <QuestionList 
                          ref={questionListRef}
                          symptomId={currentSymptom._id} 
                          symptomName={currentSymptom.name}
                          isLoggedIn={isLoggedIn}
                          onDataUpdated={fetchUserAnsweredQuestions}
                          onAnswersChange={handleAnswersChange}
                          userAge={userAge}
                          userGender={userGender}
                        />

                        {activeStep === 0 && (
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={2}
                            mt={3}
                            pt={3}
                            sx={{
                              borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={<ArrowBack />}
                              onClick={handleBack}
                              disabled={currentSymptomIndex === 0}
                              sx={{
                                px: 3,
                                py: 1.25,
                                fontWeight: 600,
                                borderRadius: 2.25,
                                textTransform: 'none',
                              }}
                            >
                              Back
                            </Button>
                            <Button
                              variant="contained"
                              endIcon={<ArrowForward />}
                              onClick={handleNext}
                              disabled={!symptoms.length || (!canProceed && !isAssessmentComplete && questionProgress < 100)}
                              sx={{
                                px: 3,
                                py: 1.25,
                                fontWeight: 700,
                                borderRadius: 2.25,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 42%, #65A30D 108%)',
                                color: '#fff',
                                boxShadow: `0 8px 22px ${alpha('#22D3EE', 0.32)}`,
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 45%, #84CC16 100%)',
                                  boxShadow: `0 12px 30px ${alpha('#22D3EE', 0.4)}`,
                                },
                                '&.Mui-disabled': {
                                  background: alpha('#94a3b8', 0.35),
                                  color: alpha('#fff', 0.8),
                                },
                              }}
                            >
                              {isAssessmentComplete || questionProgress >= 100 || currentSymptomIndex === symptoms.length - 1 ? 'Finish check-in' : 'Next question'}
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    </Fade>
                  </Grid>
                </Grid>
              )}

              {/* Step 1: Summary review — show user what they filled before proceeding */}
              {activeStep === 1 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box textAlign="center" mb={4}>
                      <Box
                        sx={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 72, height: 72, borderRadius: '50%', mb: 2,
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
                          border: (theme) => `3px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        }}
                      >
                        <Typography sx={{ fontSize: 28, fontWeight: 900, color: 'info.main' }}>✓</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 1.5 }}>
                        Here&apos;s a snapshot of your responses
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', lineHeight: 1.7 }}>
                        Take a quick look at what you shared before we run your assessment. Nothing here is a diagnosis—just what you told us. You can always go back and change anything.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mb: 4,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                        gap: 1.5,
                      }}
                    >
                      {symptoms.map((symptom) => {
                        const status = symptomCompletionStatus[symptom._id] || {};
                        const isDone = completedSymptoms.has(symptom._id);
                        return (
                          <Paper
                            key={symptom._id}
                            elevation={0}
                            sx={{
                              p: { xs: 1.75, sm: 2 },
                              borderRadius: 2.5,
                              bgcolor: (theme) => alpha(theme.palette.background.paper, isDarkMode ? 0.55 : 0.85),
                              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                              boxShadow: isDone ? `0 10px 24px ${alpha('#22D3EE', 0.1)}` : 'none',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.07em', display: 'block', mb: 0.5 }}>
                                  {symptom._diseaseName || 'Diabetes care'}
                                </Typography>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                                  {symptom.name}
                                </Typography>
                              </Box>
                              <Chip
                                label={isDone ? 'Completed' : 'Pending'}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  borderRadius: 2,
                                  bgcolor: isDone ? alpha('#84CC16', 0.12) : alpha('#94a3b8', 0.12),
                                  color: isDone ? '#4D7C0F' : 'text.secondary',
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                              {isDone && status.answered
                                ? `${status.answered} answered question${status.answered === 1 ? '' : 's'} saved.`
                                : 'This category is ready for review or is still in progress.'}
                            </Typography>
                          </Paper>
                        );
                      })}
                    </Box>

                    {!symptoms.length && <Alert severity="info">Your category summary will appear here once questions are loaded.</Alert>}

                    <Box display="flex" justifyContent="flex-end" mt={3}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<Visibility />}
                        onClick={() => handleViewAssessment()}
                        sx={{
                          px: 5, py: 1.75, fontSize: '1rem', fontWeight: 700, borderRadius: 2.25,
                          textTransform: 'none',
                          background: 'linear-gradient(135deg, #0EA5E9 0%, #22D3EE 42%, #65A30D 108%)',
                          color: '#fff',
                          boxShadow: `0 10px 28px ${alpha('#22D3EE', 0.35)}`,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 45%, #84CC16 100%)',
                            boxShadow: `0 14px 36px ${alpha('#22D3EE', 0.42)}`,
                          },
                        }}
                      >
                        View my results
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Step 2: Results — replaced by Assessment page via navigation */}
            </Box>

          </Paper>
        </Fade>
      </Container>

      {/* Login Dialog */}
      <Dialog 
        open={showLoginDialog} 
        onClose={() => {}} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 3,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              mb: 2,
            }}
          >
            <Login sx={{ fontSize: 56, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" component="p" fontWeight={700}>
            Great! One More Step
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            {isLoggedIn 
              ? "Welcome back! You've completed all questions. Click continue to view your personalized risk assessment."
              : "You've completed all onboarding questions! Sign in or create an account to view your personalized risk assessment and save your progress."
            }
          </Alert>
          {!isLoggedIn && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Your answers will be saved automatically after you log in.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          {isLoggedIn ? (
            // If user is logged in (just came back from login), show "Continue" button
            <Button
              variant="contained"
              size="large"
              onClick={() => {
                setShowLoginDialog(false);
                setActiveStep(1);
              }}
              sx={{
                px: 6,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 3,
              }}
            >
              Continue to Results
            </Button>
          ) : (
            // If user is not logged in, show signup/signin buttons
            <>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  sessionStorage.setItem('returnToSymptomAssessment', 'true');
                  navigate('/signup', { state: { fromOnboarding: true } });
                }}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 3,
                }}
              >
                Sign Up
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleLoginRedirect}
                sx={{
                  px: 6,
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: 3,
                }}
              >
                Sign In
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SymptomAssessment;
