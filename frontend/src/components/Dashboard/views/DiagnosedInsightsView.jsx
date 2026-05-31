import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowForward as ArrowForwardIcon,
  AutoAwesome as AutoAwesomeIcon,
  FitnessCenter as FitnessCenterIcon,
  LocalDining as LocalDiningIcon,
  MedicalInformation as MedicalInformationIcon,
  Psychology as PsychologyIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from '@mui/icons-material';
import './DiagnosedOverview.css';

const tones = {
  diet: '#34d399',
  exercise: '#22d3ee',
  lifestyle: '#a78bfa',
  care: '#60a5fa',
  ai: '#f0abfc',
};

const fade = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const cascade = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const getFirstName = (user) => {
  const name = user?.fullName || user?.full_name || user?.name || user?.email || 'there';
  return String(name).split(' ')[0];
};

const normalizeDiabetesType = (value) => {
  if (!value) return 'Diabetes care';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getProfileChecklist = (personalInfo, medicalInfo) => [
  Boolean(personalInfo?.gender && personalInfo?.date_of_birth),
  Boolean(personalInfo?.height && personalInfo?.weight),
  Boolean(personalInfo?.activity_level && personalInfo?.dietary_preference),
  Boolean(medicalInfo?.diabetes_type),
  Boolean(medicalInfo?.recent_lab_results?.hba1c?.value || medicalInfo?.recent_lab_results?.fasting_glucose?.value),
  Boolean(medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic),
];

const FlowService = ({ index, title, label, count, icon, tone, onAction, variant }) => (
  <motion.button
    type="button"
    className={`organic-flow-service flow-${variant}`}
    style={{ '--tone': tone }}
    onClick={onAction}
    variants={fade}
    whileHover={{ y: -10, scale: 1.05 }}
    whileTap={{ scale: 0.985 }}
  >
    <span className="flow-index">{index}</span>
    <span className="flow-orb">{icon}</span>
    <span className="flow-copy">
      <small>{label}</small>
      <strong>
        {title}
        <ArrowForwardIcon fontSize="inherit" />
      </strong>
    </span>
    <span className="flow-count">{count}</span>
  </motion.button>
);

const FloatingAction = ({ title, detail, icon, tone, onAction }) => (
  <motion.button
    type="button"
    className="floating-action"
    style={{ '--tone': tone }}
    onClick={onAction}
    variants={fade}
    whileHover={{ x: 8 }}
    whileTap={{ scale: 0.985 }}
  >
    <span>{icon}</span>
    <span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </span>
    <ArrowForwardIcon fontSize="small" />
  </motion.button>
);

function DiagnosedInsightsView({
  personalInfo,
  personalInfoCompletion,
  medicalInfo,
  user,
  onOpenTool,
  onSwitchSection,
  dietHistory = [],
  exerciseHistory = [],
  lifestyleHistory = [],
}) {
  const checklist = useMemo(() => getProfileChecklist(personalInfo, medicalInfo), [personalInfo, medicalInfo]);
  const completed = checklist.filter(Boolean).length;
  const isProfileComplete = personalInfoCompletion >= 100;

  const openProfile = () => onOpenTool?.('personal-medical');
  const openDiet = () => (isProfileComplete ? onOpenTool?.('diet-plan') : openProfile());
  const openExercise = () => (isProfileComplete ? onOpenTool?.('exercise-plan') : openProfile());
  const openLifestyle = () => (isProfileComplete ? onOpenTool?.('lifestyle-tips') : openProfile());
  const openAi = () => (isProfileComplete ? onSwitchSection?.('AI Assistant') : openProfile());
  const openCarePlan = () => onSwitchSection?.('Care Plan');

  const todayText = isProfileComplete
    ? dietHistory.length
      ? 'Continue your personalized care rhythm.'
      : 'Begin with a diabetic-friendly diet plan.'
    : 'Finish profile calibration to unlock full personalization.';

  return (
    <motion.main className="organic-care-canvas" initial="hidden" animate="visible" variants={cascade}>
      <div className="organic-ambient one" />
      <div className="organic-ambient two" />
      <div className="organic-ambient three" />
      <div className="technical-field" />

        <motion.header className="organic-command-header" variants={fade}>
          <div>
            <span>Welcome back</span>
            <h1>{getFirstName(user)}</h1>
          </div>
          <div className="header-focus">
            <strong>{todayText}</strong>
            <small className="sync-readout">
              <i />
              Care profile <b>{personalInfoCompletion >= 100 ? 'ready' : `${personalInfoCompletion}% complete`}</b>
              <span>Plans and assistant available</span>
            </small>
          </div>
        </motion.header>

      <section className="organic-first-screen">
        <motion.div className="care-narrative" variants={fade}>
          <span className="micro-label">Today&apos;s path</span>
          <h2>Choose the care service you want to continue.</h2>
          <button type="button" onClick={isProfileComplete ? openCarePlan : openProfile}>
            {isProfileComplete ? 'Open care plan' : 'Complete profile'}
            <ArrowForwardIcon fontSize="small" />
          </button>
        </motion.div>

        <motion.div className="service-wave" variants={cascade}>
          <svg className="wave-line" viewBox="0 0 900 210" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 112 C170 16 250 184 394 96 C515 22 596 56 704 110 C783 150 825 135 880 74" />
            <path className="wave-pulse" d="M20 112 C170 16 250 184 394 96 C515 22 596 56 704 110 C783 150 825 135 880 74" />
          </svg>

          <FlowService
            index="01"
            title="Diet Plan"
            label="Nutrition"
            count={dietHistory.length || 'Start'}
            icon={<LocalDiningIcon />}
            tone={tones.diet}
            onAction={openDiet}
            variant="diet"
          />
          <FlowService
            index="02"
            title="Exercise Plan"
            label="Movement"
            count={exerciseHistory.length || 'Plan'}
            icon={<FitnessCenterIcon />}
            tone={tones.exercise}
            onAction={openExercise}
            variant="exercise"
          />
          <FlowService
            index="03"
            title="Daily Lifestyle"
            label="Habits"
            count={lifestyleHistory.length ? 'Live' : 'Tips'}
            icon={<TipsAndUpdatesIcon />}
            tone={tones.lifestyle}
            onAction={openLifestyle}
            variant="lifestyle"
          />
        </motion.div>
      </section>

      <section className="organic-service-actions">
        <FloatingAction
          title="Care Plan Workspace"
          detail="Diet, exercise, lifestyle, and profile management"
          icon={<MedicalInformationIcon />}
          tone={tones.care}
          onAction={openCarePlan}
        />
        <FloatingAction
          title="AI Healthcare Assistant"
          detail={isProfileComplete ? 'Profile-aware guidance is ready' : 'Complete profile to unlock'}
          icon={<PsychologyIcon />}
          tone={tones.ai}
          onAction={openAi}
        />
      </section>

      <motion.section className="ai-live-terminal" variants={fade}>
        <div className="terminal-copy">
          <span>DiaVise AI Live Context Terminal</span>
          <strong>Ask with your care context already loaded.</strong>
        </div>
        <div className="terminal-prompts">
          <button type="button" onClick={openAi}>Optimize my lunch macro targets based on glucose data</button>
          <button type="button" onClick={openAi}>Tailor today&apos;s workout for low sleep</button>
          <button type="button" onClick={openAi}>Give me a habit hack for evening stress</button>
        </div>
        <button type="button" className="terminal-input" onClick={openAi}>
          <AutoAwesomeIcon fontSize="small" />
          <span>Ask DiaVise AI about your next care decision...</span>
          <ArrowForwardIcon fontSize="small" />
        </button>
      </motion.section>
    </motion.main>
  );
}

export default DiagnosedInsightsView;
