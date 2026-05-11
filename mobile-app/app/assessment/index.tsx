/**
 * Symptom Assessment Hub Screen
 *
 * Dynamic symptom assessment matching the web app:
 * - Fetches diseases from API
 * - For each disease, fetches symptoms
 * - For each symptom, fetches questions
 * - User answers questions
 * - Saves answers (authenticated → API, unauthenticated → AsyncStorage)
 * - Runs diabetes risk assessment
 *
 * Redesigned: gradient hero, muted cards, no Card/Button/textStyles/colors.light.*
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, RadioButton, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { TextInput } from '@components/common/TextInput';
import { FullScreenLoader } from '@components/common/FullScreenLoader';
import { ErrorState } from '@components/common/ErrorState';
import { useAppSelector } from '@store/hooks';
import { selectUser, selectIsAuthenticated } from '@features/auth/authSlice';
import {
  useGetDiseasesQuery,
  useBatchSaveAnswersMutation,
  useRunDiabetesAssessmentMutation,
} from '@features/assessment/assessmentApi';
import { storage, STORAGE_KEYS } from '@utils/storage';
import { getRuntimeApiUrl } from '@utils/constants';
import { spacing, borderRadius, shadows } from '@theme/spacing';
import colors from '@theme/colors';
import type { Disease, Symptom, Question } from '@app-types/api';

const HERO_FROM = '#3D5A80';
const HERO_TO = '#293D56';

interface AnswerEntry {
  questionId: string;
  answerText: string;
  diseaseId: string;
  symptomId: string;
  questionText: string;
}

type AssessmentStep = 'disease-select' | 'symptom-questions' | 'review';

export default function AssessmentScreen() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [step, setStep] = useState<AssessmentStep>('disease-select');
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [currentSymptomIndex, setCurrentSymptomIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loadingSymptoms, setLoadingSymptoms] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [heightValues, setHeightValues] = useState<Record<string, { feet: string; inches: string }>>({}); 
  const [apiUrl, setApiUrl] = useState<string>('');

  // Resolve the API URL once on mount so we can show it in error messages
  useEffect(() => {
    getRuntimeApiUrl().then(setApiUrl).catch(() => {});
  }, []);

  const { data: diseasesData, isLoading: diseasesLoading, error: diseasesError, refetch: refetchDiseases } = useGetDiseasesQuery(undefined, { refetchOnMountOrArgChange: true });
  const [batchSaveAnswers] = useBatchSaveAnswersMutation();
  const [runAssessment, { isLoading: assessmentLoading }] = useRunDiabetesAssessmentMutation();

  const diseases = diseasesData?.data || [];
  const currentSymptom = symptoms[currentSymptomIndex];
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;
  const totalSymptoms = symptoms.length;

  const progress = totalSymptoms > 0
    ? (currentSymptomIndex + (totalQuestions > 0 ? currentQuestionIndex / totalQuestions : 0)) / totalSymptoms
    : 0;

  // ——— Handlers ———

  const loadQuestionsForSymptom = async (symptomId: string) => {
    setLoadingQuestions(true);
    setCurrentQuestionIndex(0);
    setCurrentAnswer('');
    try {
      const apiUrl = await getRuntimeApiUrl();
      const response = await fetch(`${apiUrl}/questions/public/symptom/${symptomId}`);
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        setCurrentQuestions(data.data);
      } else {
        handleNextSymptom();
      }
    } catch {
      Alert.alert('Error', 'Failed to load questions.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleNextSymptom = () => {
    if (currentSymptomIndex < totalSymptoms - 1) {
      const nextIdx = currentSymptomIndex + 1;
      setCurrentSymptomIndex(nextIdx);
      loadQuestionsForSymptom(symptoms[nextIdx]._id);
    } else {
      setStep('review');
    }
  };

  const handleDiseaseSelect = useCallback(async (disease: Disease) => {
    setSelectedDisease(disease);
    setLoadingSymptoms(true);
    try {
      const apiUrl = await getRuntimeApiUrl();
      const response = await fetch(`${apiUrl}/symptoms/public/${disease._id}`);
      const data = await response.json();
      if (data.success && data.data?.length > 0) {
        setSymptoms(data.data);
        setCurrentSymptomIndex(0);
        setStep('symptom-questions');
        const firstSymptomId = data.data[0]._id;
        setLoadingQuestions(true);
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
        try {
          const qRes = await fetch(`${apiUrl}/questions/public/symptom/${firstSymptomId}`);
          const qData = await qRes.json();
          if (qData.success && qData.data?.length > 0) {
            setCurrentQuestions(qData.data);
          }
        } catch {
          Alert.alert('Error', 'Failed to load questions.');
        } finally {
          setLoadingQuestions(false);
        }
      } else {
        Alert.alert('No Symptoms', 'No symptoms found for this condition.');
      }
    } catch {
      Alert.alert('Error', 'Failed to load symptoms. Please try again.');
    } finally {
      setLoadingSymptoms(false);
    }
  }, []);

  const handleAnswer = () => {
    if (!currentAnswer.trim()) {
      Alert.alert('Required', 'Please provide an answer before continuing.');
      return;
    }
    const entry: AnswerEntry = {
      questionId: currentQuestion._id,
      answerText: currentAnswer.trim(),
      diseaseId: selectedDisease!._id,
      symptomId: currentSymptom._id,
      questionText: currentQuestion.question_text,
    };
    setAnswers((prev) => [...prev, entry]);
    setCurrentAnswer('');
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleNextSymptom();
    }
  };

  const handleSubmit = async () => {
    try {
      if (isAuthenticated) {
        await batchSaveAnswers({
          answers: answers.map((a) => ({
            questionId: a.questionId,
            answerText: a.answerText,
          })),
        }).unwrap();
        const result = await runAssessment({ force_new: true }).unwrap();
        router.push({
          pathname: '/assessment/results' as any,
          params: { data: JSON.stringify(result.data) },
        });
      } else {
        await storage.setItem(STORAGE_KEYS.PENDING_ONBOARDING_ANSWERS, {
          answers,
          diseaseId: selectedDisease?._id,
          submittedAt: new Date().toISOString(),
        });
        Alert.alert(
          'Assessment Saved',
          'Sign in or create an account to get your risk assessment results.',
          [
            { text: 'Sign Up', onPress: () => router.push('/(auth)/signup') },
            { text: 'Sign In', onPress: () => router.push('/(auth)/signin'), style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to submit assessment.');
    }
  };

  const handleRestart = () => {
    setStep('disease-select');
    setAnswers([]);
    setSelectedDisease(null);
    setSymptoms([]);
  };

  // ——— Step label for hero ———
  const heroLabel = step === 'disease-select'
    ? 'Select Condition'
    : step === 'symptom-questions'
    ? `Symptom ${currentSymptomIndex + 1}/${totalSymptoms}`
    : 'Review & Submit';

  // ——— Renders ———

  const renderDiseaseSelection = () => {
    if (diseasesLoading) return <FullScreenLoader />;
    if (diseasesError) {
      const urlHint = apiUrl ? `\n\nServer: ${apiUrl}` : '';
      return (
        <ErrorState
          onRetry={refetchDiseases}
          error={`Failed to load conditions. Make sure the backend server is running and reachable from this device.${urlHint}`}
        />
      );
    }

    return (
      <View style={st.stepWrap}>
        <Text style={st.stepTitle}>Select a Condition</Text>
        <Text style={st.stepDesc}>Choose the condition you would like to assess your risk for.</Text>

        {loadingSymptoms && (
          <ActivityIndicator size="large" color={HERO_FROM} style={{ marginVertical: spacing[6] }} />
        )}

        {diseases.map((disease) => {
          const selected = selectedDisease?._id === disease._id;
          return (
            <TouchableOpacity
              key={disease._id}
              style={[st.diseaseCard, selected && st.diseaseCardActive]}
              activeOpacity={0.7}
              onPress={() => !loadingSymptoms && handleDiseaseSelect(disease)}
            >
              <View style={[st.diseaseIcon, selected && st.diseaseIconActive]}>
                <MaterialCommunityIcons name="stethoscope" size={18} color={selected ? '#FFF' : HERO_FROM} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.diseaseName}>{disease.name}</Text>
                {disease.description ? <Text style={st.diseaseDesc}>{disease.description}</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderQuestions = () => {
    if (loadingQuestions) {
      return <ActivityIndicator size="large" color={HERO_FROM} style={{ marginVertical: spacing[6] }} />;
    }

    if (!currentQuestion) {
      return (
        <View style={st.emptyCard}>
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={32} color={colors.neutral[400]} />
          <Text style={st.emptyText}>No questions for this symptom.</Text>
        </View>
      );
    }

    const btnLabel =
      currentQuestionIndex < totalQuestions - 1
        ? 'Next Question'
        : currentSymptomIndex < totalSymptoms - 1
        ? 'Next Symptom'
        : 'Review Answers';

    return (
      <View style={st.stepWrap}>
        {/* Progress info */}
        <View style={st.progressInfo}>
          <Text style={st.progressLabel}>{currentSymptom?.name}</Text>
          <Text style={st.progressSub}>Question {currentQuestionIndex + 1} of {totalQuestions}</Text>
        </View>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Question card */}
        <View style={st.questionCard}>
          <Text style={st.questionText}>{currentQuestion.question_text}</Text>

          {/* Radio input */}
          {(currentQuestion.question_type === 'radio' || currentQuestion.input_type === 'radio') && currentQuestion.options ? (
            <RadioButton.Group onValueChange={setCurrentAnswer} value={currentAnswer}>
              {currentQuestion.options.map((option) => (
                <TouchableOpacity key={option} style={[st.optionRow, currentAnswer === option && st.optionRowActive]} onPress={() => setCurrentAnswer(option)} activeOpacity={0.7}>
                  <RadioButton value={option} color={HERO_FROM} />
                  <Text style={[st.optionLabel, currentAnswer === option && st.optionLabelActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          ) : (currentQuestion.question_type === 'select' || currentQuestion.question_type === 'dropdown' || currentQuestion.input_type === 'select') && currentQuestion.options ? (
            /* Chip select */
            <View style={st.chipWrap}>
              {currentQuestion.options.map((option) => (
                <TouchableOpacity key={option} style={[st.chip, currentAnswer === option && st.chipActive]} onPress={() => setCurrentAnswer(option)} activeOpacity={0.7}>
                  <Text style={[st.chipText, currentAnswer === option && st.chipTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (currentQuestion.question_type === 'checkbox' || currentQuestion.input_type === 'checkbox') && currentQuestion.options ? (
            /* Checkbox */
            <View>
              {currentQuestion.options.map((option) => {
                const parts = currentAnswer ? currentAnswer.split(',').map(s => s.trim()).filter(Boolean) : [];
                const selected = parts.includes(option);
                return (
                  <TouchableOpacity key={option} style={[st.optionRow, selected && st.optionRowActive]} onPress={() => {
                    if (selected) setCurrentAnswer(parts.filter(p => p !== option).join(', '));
                    else setCurrentAnswer([...parts, option].join(', '));
                  }} activeOpacity={0.7}>
                    <Checkbox status={selected ? 'checked' : 'unchecked'} color={HERO_FROM} />
                    <Text style={[st.optionLabel, selected && st.optionLabelActive]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : currentQuestion.render_config?.type === 'unit_conversion' ? (
            /* Height in ft/inches → stored as cm */
            (() => {
              const config = currentQuestion.render_config!.config;
              const feetUnit = config.from_units.find(u => u.name === 'feet');
              const inchesUnit = config.from_units.find(u => u.name === 'inches');
              const feetOptions = feetUnit?.options || [3, 4, 5, 6, 7, 8];
              const inchesOptions = inchesUnit?.options || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
              const cur = heightValues[currentQuestion._id] || { feet: '', inches: '' };

              const updateHeight = (feet: string, inches: string) => {
                setHeightValues(prev => ({ ...prev, [currentQuestion._id]: { feet, inches } }));
                const ft = parseFloat(feet) || 0;
                const inc = parseFloat(inches) || 0;
                const totalCm = Math.round((ft * 30.48) + (inc * 2.54));
                if (feet || inches) setCurrentAnswer(totalCm.toString());
                else setCurrentAnswer('');
              };

              return (
                <View>
                  {/* Feet */}
                  <Text style={st.heightLabel}>{feetUnit?.label || 'Feet'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[3] }}>
                    <View style={st.chipWrap}>
                      {feetOptions.map(ft => {
                        const active = cur.feet === String(ft);
                        return (
                          <TouchableOpacity key={ft} style={[st.chip, active && st.chipActive]} onPress={() => updateHeight(String(ft), cur.inches)} activeOpacity={0.7}>
                            <Text style={[st.chipText, active && st.chipTextActive]}>{ft} ft</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Inches */}
                  <Text style={st.heightLabel}>{inchesUnit?.label || 'Inches'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[2] }}>
                    <View style={st.chipWrap}>
                      {inchesOptions.map(inc => {
                        const active = cur.inches === String(inc);
                        return (
                          <TouchableOpacity key={inc} style={[st.chip, active && st.chipActive]} onPress={() => updateHeight(cur.feet, String(inc))} activeOpacity={0.7}>
                            <Text style={[st.chipText, active && st.chipTextActive]}>{inc} in</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {/* Show converted cm */}
                  {cur.feet && cur.inches !== '' && (
                    <Text style={st.heightHint}>
                      {Math.round((parseFloat(cur.feet) * 30.48) + (parseFloat(cur.inches) * 2.54))} cm
                    </Text>
                  )}
                </View>
              );
            })()
          ) : (currentQuestion.question_type === 'number' || currentQuestion.input_type === 'number') ? (
            <TextInput label="Your Answer" value={currentAnswer} onChangeText={setCurrentAnswer} keyboardType="numeric" />
          ) : (
            <TextInput label="Your Answer" value={currentAnswer} onChangeText={setCurrentAnswer} multiline numberOfLines={3} />
          )}

          {/* Next button */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleAnswer} style={{ marginTop: spacing[4] }}>
            <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.gradBtn}>
              <Text style={st.gradBtnText}>{btnLabel}</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReview = () => (
    <View style={st.stepWrap}>
      <Text style={st.stepTitle}>Review Your Answers</Text>
      <Text style={st.stepDesc}>
        You answered {answers.length} questions. Review and submit to get your risk assessment.
      </Text>

      {answers.map((answer, idx) => (
        <View key={idx} style={st.reviewCard}>
          <View style={st.reviewNum}>
            <Text style={st.reviewNumText}>{idx + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.reviewQuestion}>{answer.questionText}</Text>
            <Text style={st.reviewAnswer}>{answer.answerText}</Text>
          </View>
        </View>
      ))}

      {/* Submit */}
      <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} disabled={assessmentLoading} style={{ marginTop: spacing[4] }}>
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.gradBtn}>
          <Text style={st.gradBtnText}>
            {assessmentLoading ? 'Submitting...' : isAuthenticated ? 'Submit & Get Results' : 'Save & Continue to Sign Up'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Start over */}
      <TouchableOpacity style={st.ghostBtn} activeOpacity={0.7} onPress={handleRestart}>
        <MaterialCommunityIcons name="restart" size={16} color={colors.neutral[600]} />
        <Text style={st.ghostBtnText}>Start Over</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[HERO_FROM, HERO_TO]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.hero}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard')} style={st.heroBack}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={st.heroRow}>
            <View style={st.heroIconWrap}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={22} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.heroTitle}>Health Assessment</Text>
              <Text style={st.heroSub}>{heroLabel}</Text>
            </View>
          </View>
        </LinearGradient>

        {step === 'disease-select' && renderDiseaseSelection()}
        {step === 'symptom-questions' && renderQuestions()}
        {step === 'review' && renderReview()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ——— Styles ———
const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[12] },

  // Hero
  hero: { borderRadius: borderRadius.lg, padding: spacing[5], marginBottom: spacing[5], ...shadows.md },
  heroBack: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing[3] },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Step
  stepWrap: { gap: spacing[3] },
  stepTitle: { fontSize: 18, fontWeight: '700', color: colors.neutral[800] },
  stepDesc: { fontSize: 13, fontWeight: '400', color: colors.neutral[500], marginBottom: spacing[2] },

  // Disease cards
  diseaseCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[100], ...shadows.xs },
  diseaseCardActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '08' },
  diseaseIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: HERO_FROM + '10', justifyContent: 'center', alignItems: 'center' },
  diseaseIconActive: { backgroundColor: HERO_FROM },
  diseaseName: { fontSize: 15, fontWeight: '600', color: colors.neutral[800] },
  diseaseDesc: { fontSize: 12, fontWeight: '400', color: colors.neutral[500], marginTop: 2 },

  // Progress
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[700] },
  progressSub: { fontSize: 12, fontWeight: '500', color: colors.neutral[500] },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: colors.neutral[200], overflow: 'hidden', marginBottom: spacing[2] },
  progressFill: { height: '100%', backgroundColor: HERO_FROM, borderRadius: 2 },

  // Question card
  questionCard: { backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[5], borderWidth: 1, borderColor: colors.neutral[100], ...shadows.xs },
  questionText: { fontSize: 16, fontWeight: '600', color: colors.neutral[800], marginBottom: spacing[4] },

  // Option rows (radio/checkbox)
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], borderRadius: borderRadius.sm, paddingVertical: spacing[2], paddingHorizontal: spacing[2], marginBottom: spacing[1], backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[100] },
  optionRowActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '08' },
  optionLabel: { fontSize: 14, fontWeight: '500', color: colors.neutral[700], flex: 1 },
  optionLabelActive: { color: HERO_FROM, fontWeight: '600' },

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
  chip: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[50] },
  chipActive: { borderColor: HERO_FROM, backgroundColor: HERO_FROM + '10' },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.neutral[600] },
  chipTextActive: { color: HERO_FROM },

  // Empty
  emptyCard: { alignItems: 'center', gap: spacing[3], padding: spacing[8], backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.neutral[100] },
  emptyText: { fontSize: 14, fontWeight: '500', color: colors.neutral[500] },

  // Review
  reviewCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.neutral[0], borderRadius: borderRadius.md, padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[100] },
  reviewNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: HERO_FROM + '10', justifyContent: 'center', alignItems: 'center' },
  reviewNumText: { fontSize: 12, fontWeight: '700', color: HERO_FROM },
  reviewQuestion: { fontSize: 12, fontWeight: '500', color: colors.neutral[500], marginBottom: 2 },
  reviewAnswer: { fontSize: 14, fontWeight: '600', color: colors.neutral[800] },

  // Buttons
  gradBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] + 2, borderRadius: borderRadius.md, ...shadows.sm },
  gradBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  ghostBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3], marginTop: spacing[2] },
  ghostBtnText: { fontSize: 14, fontWeight: '600', color: colors.neutral[600] },

  // Height ft/inches
  heightLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[600], marginBottom: spacing[2] },
  heightHint: { fontSize: 13, fontWeight: '500', color: colors.neutral[500], textAlign: 'center', marginTop: spacing[1] },
});
