import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [onboardingState, setOnboardingState] = useState({
    isCompleted: false,
    isDiagnosed: null, // null, 'yes', or 'no'
    answers: {}, // Store all answers: { questionId: answerId }
    userInfo: {
      age: null,
      gender: null,
    },
    currentStep: 'initial', // 'initial', 'tour', 'diagnosis', 'questions', 'completed'
  });

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('onboardingState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setOnboardingState(parsed);
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('onboardingState', JSON.stringify(onboardingState));
  }, [onboardingState]);

  const updateDiagnosisStatus = useCallback((status) => {
    setOnboardingState((prev) => ({
      ...prev,
      isDiagnosed: status,
      currentStep: status === 'yes' ? 'completed' : 'questions',
    }));
  }, []);

  const updateAnswer = useCallback((questionId, answerId) => {
    setOnboardingState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answerId,
      },
    }));
  }, []);

  const updateUserInfo = useCallback((info) => {
    setOnboardingState((prev) => ({
      ...prev,
      userInfo: {
        ...prev.userInfo,
        ...info,
      },
    }));
  }, []);

  const setCurrentStep = useCallback((step) => {
    setOnboardingState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingState((prev) => ({
      ...prev,
      isCompleted: true,
      currentStep: 'completed',
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingState({
      isCompleted: false,
      isDiagnosed: null,
      answers: {},
      userInfo: {
        age: null,
        gender: null,
      },
      currentStep: 'initial',
    });
    sessionStorage.removeItem('onboardingState');
  }, []);

  const getAnswersArray = useCallback(() => {
    // Convert answers object to array format for API submission
    return Object.entries(onboardingState.answers).map(([questionId, answerId]) => ({
      question_id: questionId,
      answer_id: answerId,
    }));
  }, [onboardingState.answers]);

  const hasAnswers = useCallback(() => {
    return Object.keys(onboardingState.answers).length > 0;
  }, [onboardingState.answers]);

  const value = {
    onboardingState,
    updateDiagnosisStatus,
    updateAnswer,
    updateUserInfo,
    setCurrentStep,
    completeOnboarding,
    resetOnboarding,
    getAnswersArray,
    hasAnswers,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
