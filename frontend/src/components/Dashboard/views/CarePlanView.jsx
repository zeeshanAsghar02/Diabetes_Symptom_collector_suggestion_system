import React, { useMemo, useState } from 'react';
import {
  AutoAwesome as AutoAwesomeIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  FitnessCenter as FitnessCenterIcon,
  LocalDining as LocalDiningIcon,
  MedicalInformation as MedicalInformationIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from '@mui/icons-material';
import NutritionAnalytics from '../analytics/NutritionAnalytics';
import ExerciseAnalytics from '../analytics/ExerciseAnalytics';
import './CarePlanView.css';

const tabs = [
  {
    key: 'nutrition',
    label: 'Nutrition',
    icon: LocalDiningIcon,
    tool: 'diet-plan',
    accent: '#34d399',
    cta: 'View or generate your diet plan',
  },
  {
    key: 'exercise',
    label: 'Exercise',
    icon: FitnessCenterIcon,
    tool: 'exercise-plan',
    accent: '#22d3ee',
    cta: 'View or generate your exercise routine',
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle',
    icon: TipsAndUpdatesIcon,
    tool: 'lifestyle-tips',
    accent: '#a78bfa',
    cta: 'View or generate your lifestyle tips',
  },
  {
    key: 'medical',
    label: 'Medical Profile',
    icon: MedicalInformationIcon,
    tool: 'personal-medical',
    accent: '#60a5fa',
    cta: 'View and edit your profile data',
  },
];

const getChecklist = (personalInfo, medicalInfo) => [
  { label: 'Personal details', complete: Boolean(personalInfo?.gender && personalInfo?.date_of_birth) },
  { label: 'Body measurements', complete: Boolean(personalInfo?.height && personalInfo?.weight) },
  { label: 'Activity level', complete: Boolean(personalInfo?.activity_level) },
  { label: 'Diet preference', complete: Boolean(personalInfo?.dietary_preference) },
  { label: 'Diabetes type', complete: Boolean(medicalInfo?.diabetes_type) },
  { label: 'Medication details', complete: Array.isArray(medicalInfo?.current_medications) && medicalInfo.current_medications.length > 0 },
  { label: 'Lab values', complete: Boolean(medicalInfo?.recent_lab_results?.hba1c?.value || medicalInfo?.recent_lab_results?.fasting_glucose?.value) },
  { label: 'Blood pressure', complete: Boolean(medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic) },
];

const metricText = (value, fallback = 'Pending') => (value || value === 0 ? value : fallback);
const lifestyleGuideText = 'Our system creates your daily lifestyle tips by securely combining your personal and medical information with trusted diabetes management guidelines. By analyzing your profile details, our AI engine instantly matches your needs with established medical practices to deliver simple, actionable habits built specifically to support your daily health journey.';

function EmptyInsight({ title, actionLabel, onAction }) {
  return (
    <button type="button" className="care-empty-signal" onClick={onAction}>
      <span>{title}</span>
      <strong>{actionLabel}</strong>
      <ArrowForwardIcon fontSize="small" />
    </button>
  );
}

function CarePlanView({
  planUsageAnalytics,
  macronutrientBalance,
  mealWiseDistribution,
  bmiAnalytics,
  personalInfo,
  personalInfoCompletion,
  medicalInfo,
  dietHistory = [],
  exerciseHistory = [],
  lifestyleHistory = [],
  onOpenTool,
}) {
  const [tab, setTab] = useState('nutrition');
  const [lifestyleSynthesisQueued, setLifestyleSynthesisQueued] = useState(false);
  const isProfileComplete = personalInfoCompletion >= 100;
  const checklist = useMemo(() => getChecklist(personalInfo, medicalInfo), [personalInfo, medicalInfo]);
  const activeTab = tabs.find((item) => item.key === tab) || tabs[0];
  const ActiveIcon = activeTab.icon;

  const queueLifestyleSynthesis = (source) => {
    setLifestyleSynthesisQueued(true);
    window.dispatchEvent(new CustomEvent('diavise:lifestyle-synthesis-queued', {
      detail: {
        source,
        queuedAt: new Date().toISOString(),
      },
    }));
  };

  const openActiveTool = () => {
    onOpenTool?.(isProfileComplete ? activeTab.tool : 'personal-medical');
  };

  const handleTabChange = (key) => {
    setTab(key);
    if (key === 'lifestyle' && lifestyleHistory.length === 0) {
      queueLifestyleSynthesis('lifestyle-tab');
    }
  };

  return (
    <main className="care-plan-os">
      <div className="care-plan-ambient one" />
      <div className="care-plan-ambient two" />
      <div className="care-plan-mesh" />

      <header className="care-plan-command">
        <div>
          <span className="care-plan-eyebrow">Care Plan OS</span>
          <h1>{activeTab.label} workspace</h1>
        </div>

        <button type="button" className="care-plan-inline-action" onClick={openActiveTool}>
          <span>{isProfileComplete ? activeTab.cta : 'Complete Medical Profile'}</span>
          <ArrowForwardIcon fontSize="small" />
        </button>
      </header>

      <nav className="care-plan-tabs" aria-label="Care plan sections">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === tab;
          return (
            <button
              key={item.key}
              type="button"
              className={`care-plan-tab${isActive ? ' is-active' : ''}`}
              onClick={() => handleTabChange(item.key)}
              style={{ '--tab-accent': item.accent }}
            >
              <Icon fontSize="small" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="care-plan-status-strip">
        <div>
          <ActiveIcon fontSize="small" />
          <span>{activeTab.label}</span>
        </div>
        <p>
          {lifestyleSynthesisQueued
            ? 'Lifestyle synthesis queued from active care signals'
            : isProfileComplete ? 'Profile-aware engine synchronized' : `${personalInfoCompletion}% profile calibration`}
        </p>
      </section>

      {tab === 'nutrition' && (
        <section className="care-plan-panel">
          <NutritionAnalytics
            planUsageAnalytics={planUsageAnalytics}
            macronutrientBalance={macronutrientBalance}
            mealWiseDistribution={mealWiseDistribution}
            onAnalyticsInteract={() => queueLifestyleSynthesis('nutrition-analytics')}
          />
          {dietHistory.length === 0 && !planUsageAnalytics?.dietStats?.daysWithPlan && (
            <EmptyInsight
              title="Nutrition data stream is not initialized"
              actionLabel={isProfileComplete ? 'Generate Diet Plan' : 'Complete Profile'}
              onAction={() => onOpenTool?.(isProfileComplete ? 'diet-plan' : 'personal-medical')}
            />
          )}
        </section>
      )}

      {tab === 'exercise' && (
        <section className="care-plan-panel care-plan-panel-muted">
          <button type="button" className="care-plan-service-launch" onClick={() => onOpenTool?.(isProfileComplete ? 'exercise-plan' : 'personal-medical')}>
            <FitnessCenterIcon />
            <span>Open Exercise Intelligence</span>
            <ArrowForwardIcon />
          </button>
          <ExerciseAnalytics
            planUsageAnalytics={planUsageAnalytics}
            onAnalyticsInteract={() => queueLifestyleSynthesis('exercise-analytics')}
          />
          {exerciseHistory.length === 0 && !planUsageAnalytics?.exerciseStats?.daysWithPlan && (
            <EmptyInsight
              title="Exercise data stream is not initialized"
              actionLabel={isProfileComplete ? 'Create Exercise Plan' : 'Complete Profile'}
              onAction={() => onOpenTool?.(isProfileComplete ? 'exercise-plan' : 'personal-medical')}
            />
          )}
        </section>
      )}

      {tab === 'lifestyle' && (
        <section className="lifestyle-workspace">
          <section className="lifestyle-guide">
            <h2>How Your Lifestyle Tips are Generated</h2>
            <div className="lifestyle-guide-copy">
              <p>{lifestyleGuideText}</p>
            </div>
          </section>
        </section>
      )}

      {tab === 'medical' && (
        <section className="medical-matrix">
          <div className="medical-checklist">
            {checklist.map((item) => (
              <div key={item.label} className={`medical-row${item.complete ? ' is-complete' : ''}`}>
                <CheckCircleIcon fontSize="small" />
                <span>{item.label}</span>
                <b>{item.complete ? 'Ready' : 'Missing'}</b>
              </div>
            ))}
          </div>

          <div className="medical-readouts">
            <div>
              <small>BMI</small>
              <strong>{metricText(bmiAnalytics?.value)}</strong>
              <span>{bmiAnalytics?.label || 'Height and weight required'}</span>
            </div>
            <div>
              <small>Diabetes Type</small>
              <strong>{metricText(medicalInfo?.diabetes_type)}</strong>
              <span>Profile personalization signal</span>
            </div>
            <div>
              <small>HbA1c</small>
              <strong>
                {medicalInfo?.recent_lab_results?.hba1c?.value
                  ? `${medicalInfo.recent_lab_results.hba1c.value}${medicalInfo.recent_lab_results.hba1c.unit || '%'}`
                  : 'Pending'}
              </strong>
              <span>Latest entered lab value</span>
            </div>
            <div>
              <small>Blood Pressure</small>
              <strong>
                {medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic
                  ? `${medicalInfo.blood_pressure.systolic}/${medicalInfo.blood_pressure.diastolic}`
                  : 'Pending'}
              </strong>
              <span>Manual medical record</span>
            </div>
          </div>

          <button type="button" className="medical-update" onClick={() => onOpenTool?.('personal-medical')}>
            Update Medical Profile
            <ArrowForwardIcon fontSize="small" />
          </button>
        </section>
      )}
    </main>
  );
}

export default CarePlanView;
