import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  alpha,
} from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  LocalDining as LocalDiningIcon,
  MedicalInformation as MedicalInformationIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from '@mui/icons-material';
import NutritionAnalytics from '../analytics/NutritionAnalytics';
import ExerciseAnalytics from '../analytics/ExerciseAnalytics';

const panelSx = {
  borderRadius: 3,
  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.72)}`,
  background: (theme) => theme.palette.background.paper,
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

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

const ToolIntroCard = ({ icon, title, description, actionLabel, onAction, accent, locked, helper }) => (
  <Paper elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 2.75 }, mb: 3 }}>
    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: accent,
            bgcolor: alpha(accent, 0.1),
            border: `1px solid ${alpha(accent, 0.2)}`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.35 }}>
            <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a' }}>
              {title}
            </Typography>
            {locked && <Chip label="Needs profile" color="warning" size="small" sx={{ fontWeight: 750 }} />}
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.65 }}>
            {description}
          </Typography>
          {helper && (
            <Typography variant="caption" sx={{ color: locked ? '#b45309' : '#64748b', fontWeight: 700, display: 'block', mt: 0.7 }}>
              {helper}
            </Typography>
          )}
        </Box>
      </Stack>
      <Button
        variant={locked ? 'outlined' : 'contained'}
        onClick={onAction}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 850,
          px: 3,
          py: 1.1,
          bgcolor: locked ? 'transparent' : accent,
          borderColor: alpha(accent, 0.4),
          color: locked ? accent : '#fff',
          '&:hover': {
            bgcolor: locked ? alpha(accent, 0.08) : accent,
          },
        }}
      >
        {actionLabel}
      </Button>
    </Stack>
  </Paper>
);

const EmptyInsight = ({ title, body, actionLabel, onAction }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 3, md: 4 },
      textAlign: 'center',
      borderRadius: 3,
      border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
      bgcolor: alpha('#f8fafc', 0.9),
    }}
  >
    <Typography variant="h6" fontWeight={850} sx={{ color: '#0f172a', mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 560, mx: 'auto', mb: 2.5, lineHeight: 1.7 }}>
      {body}
    </Typography>
    <Button variant="contained" onClick={onAction} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}>
      {actionLabel}
    </Button>
  </Paper>
);

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
  const isProfileComplete = personalInfoCompletion >= 100;
  const checklist = useMemo(() => getChecklist(personalInfo, medicalInfo), [personalInfo, medicalInfo]);

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h4" fontWeight={950} sx={{ color: '#0f172a', letterSpacing: 0 }}>
              My Care Plan
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.7, lineHeight: 1.7 }}>
              Detailed nutrition, exercise, lifestyle, and medical profile insights live here, keeping your Overview clean.
            </Typography>
          </Box>
          <Chip
            label={isProfileComplete ? 'Profile complete' : `${personalInfoCompletion}% profile complete`}
            color={isProfileComplete ? 'success' : 'info'}
            sx={{ fontWeight: 800, alignSelf: { xs: 'flex-start', md: 'center' } }}
          />
        </Stack>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 2,
              mr: 1,
            },
            '& .Mui-selected': {
              bgcolor: alpha('#2563eb', 0.08),
            },
          }}
        >
          <Tab value="nutrition" label="Nutrition" icon={<LocalDiningIcon />} iconPosition="start" />
          <Tab value="exercise" label="Exercise" icon={<FitnessCenterIcon />} iconPosition="start" />
          <Tab value="lifestyle" label="Lifestyle" icon={<TipsAndUpdatesIcon />} iconPosition="start" />
          <Tab value="medical" label="Medical Profile" icon={<MedicalInformationIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {tab === 'nutrition' && (
        <Box>
          <ToolIntroCard
            icon={<LocalDiningIcon />}
            title="Nutrition Planning"
            description="Open your diet tools, then use the graphs below to understand calories, macros, and meal distribution."
            actionLabel={isProfileComplete ? 'Open Diet Plan' : 'Complete Profile'}
            onAction={() => onOpenTool?.(isProfileComplete ? 'diet-plan' : 'personal-medical')}
            accent="#059669"
            locked={!isProfileComplete}
            helper={dietHistory.length ? `${dietHistory.length} diet record${dietHistory.length === 1 ? '' : 's'} available for analytics.` : 'Generate a plan to unlock richer nutrition trends.'}
          />
          {dietHistory.length > 0 || planUsageAnalytics?.dietStats?.daysWithPlan > 0 ? (
            <NutritionAnalytics
              planUsageAnalytics={planUsageAnalytics}
              macronutrientBalance={macronutrientBalance}
              mealWiseDistribution={mealWiseDistribution}
            />
          ) : (
            <EmptyInsight
              title="No nutrition trends yet"
              body="Generate your first diet plan to unlock macro balance, meal distribution, and calorie trend insights."
              actionLabel={isProfileComplete ? 'Generate Diet Plan' : 'Complete Profile'}
              onAction={() => onOpenTool?.(isProfileComplete ? 'diet-plan' : 'personal-medical')}
            />
          )}
        </Box>
      )}

      {tab === 'exercise' && (
        <Box>
          <ToolIntroCard
            icon={<FitnessCenterIcon />}
            title="Exercise Guidance"
            description="Review safe movement planning and activity analytics for your diabetes care routine."
            actionLabel={isProfileComplete ? 'Open Exercise Plan' : 'Complete Profile'}
            onAction={() => onOpenTool?.(isProfileComplete ? 'exercise-plan' : 'personal-medical')}
            accent="#0ea5e9"
            locked={!isProfileComplete}
            helper={exerciseHistory.length ? `${exerciseHistory.length} exercise record${exerciseHistory.length === 1 ? '' : 's'} available.` : 'Create an exercise plan to start tracking activity insights.'}
          />
          {exerciseHistory.length > 0 || planUsageAnalytics?.exerciseStats?.daysWithPlan > 0 ? (
            <ExerciseAnalytics planUsageAnalytics={planUsageAnalytics} />
          ) : (
            <EmptyInsight
              title="No exercise trends yet"
              body="Create your first exercise plan to unlock activity duration and consistency insights."
              actionLabel={isProfileComplete ? 'Create Exercise Plan' : 'Complete Profile'}
              onAction={() => onOpenTool?.(isProfileComplete ? 'exercise-plan' : 'personal-medical')}
            />
          )}
        </Box>
      )}

      {tab === 'lifestyle' && (
        <Box>
          <ToolIntroCard
            icon={<TipsAndUpdatesIcon />}
            title="Lifestyle And Habits"
            description="Lifestyle guidance supports meal timing, hydration, sleep, walking, and daily routines."
            actionLabel={isProfileComplete ? 'View Lifestyle Tips' : 'Complete Profile'}
            onAction={() => onOpenTool?.(isProfileComplete ? 'lifestyle-tips' : 'personal-medical')}
            accent="#f59e0b"
            locked={!isProfileComplete}
            helper={lifestyleHistory.length ? `${lifestyleHistory.length} lifestyle record${lifestyleHistory.length === 1 ? '' : 's'} available.` : 'Open lifestyle tips to start building healthier routines.'}
          />
          <Grid container spacing={2.5}>
            {['Hydration', 'Meal timing', 'Sleep rhythm', 'Post-meal walking'].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item}>
                <Paper elevation={0} sx={{ ...panelSx, p: 2.25, minHeight: 132 }}>
                  <Typography variant="subtitle2" fontWeight={850} sx={{ color: '#0f172a', mb: 1 }}>
                    {item}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                    Use lifestyle tips to personalize this area from your profile and daily routine.
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tab === 'medical' && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={5}>
            <Paper elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 2.75 } }}>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 2 }}>
                Profile Checklist
              </Typography>
              <Stack spacing={1.2}>
                {checklist.map((item) => (
                  <Stack
                    key={item.label}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ p: 1.2, borderRadius: 2, bgcolor: item.complete ? alpha('#10b981', 0.06) : alpha('#f59e0b', 0.07) }}
                  >
                    <Typography variant="body2" fontWeight={750} sx={{ color: '#334155' }}>
                      {item.label}
                    </Typography>
                    <Chip label={item.complete ? 'Complete' : 'Missing'} color={item.complete ? 'success' : 'warning'} size="small" sx={{ fontWeight: 750 }} />
                  </Stack>
                ))}
              </Stack>
              <Button fullWidth variant="contained" onClick={() => onOpenTool?.('personal-medical')} sx={{ mt: 2.5, borderRadius: 2, textTransform: 'none', fontWeight: 850 }}>
                Update Medical Profile
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ ...panelSx, p: { xs: 2.25, md: 2.75 }, height: '100%' }}>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#0f172a', mb: 2 }}>
                Latest Entered Medical Values
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>BMI</Typography>
                  <Typography variant="h5" fontWeight={900}>{bmiAnalytics?.value || 'Not entered'}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>{bmiAnalytics?.label || 'Add height and weight'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Diabetes Type</Typography>
                  <Typography variant="h5" fontWeight={900}>{medicalInfo?.diabetes_type || 'Not entered'}</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Used for plan personalization</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>HbA1c</Typography>
                  <Typography variant="h5" fontWeight={900}>
                    {medicalInfo?.recent_lab_results?.hba1c?.value ? `${medicalInfo.recent_lab_results.hba1c.value}${medicalInfo.recent_lab_results.hba1c.unit || '%'}` : 'Not entered'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Latest entered lab value</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Blood Pressure</Typography>
                  <Typography variant="h5" fontWeight={900}>
                    {medicalInfo?.blood_pressure?.systolic && medicalInfo?.blood_pressure?.diastolic
                      ? `${medicalInfo.blood_pressure.systolic}/${medicalInfo.blood_pressure.diastolic}`
                      : 'Not entered'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>Manual medical record</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default CarePlanView;
