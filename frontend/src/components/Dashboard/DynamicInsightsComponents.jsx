// ============================================================================
// DYNAMIC INSIGHTS COMPONENTS - Add these to your Dashboard.jsx
// ============================================================================

import React from 'react';
import {
  Box, Paper, Typography, Chip, Button, IconButton, Tooltip,
  ToggleButtonGroup, ToggleButton, Accordion, AccordionSummary,
  AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions,
  Menu, MenuItem, List, ListItem, ListItemText, ListItemIcon,
  TextField, Grid, LinearProgress, Zoom, Fade, SpeedDial,
  SpeedDialAction, SpeedDialIcon
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  GetApp as GetAppIcon, Menu as MenuIcon, KeyboardArrowUp as KeyboardArrowUpIcon,
  ExpandMore as ExpandMoreIcon, Flag as FlagIcon, Add as AddIcon,
  Delete as DeleteIcon, Close as CloseIcon, PictureAsPdf as PictureAsPdfIcon,
  TableChart as TableChartIcon, Healing as HealingIcon, Science as ScienceIcon,
  Assessment as AssessmentIcon, FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material';

// ============================================================================
// 1. CONSISTENCY SCORE BADGE
// ============================================================================
export const ConsistencyScoreBadge = ({ 
  consistencyScore, 
  consistencyBadge, 
  chartTimeRange,
  planUsageAnalytics 
}) => {
  if (!planUsageAnalytics) return null;

  return (
    <Zoom in timeout={500}>
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: 3,
          background: (t) => alpha(consistencyBadge.color, 0.08),
          border: (t) => `2px solid ${alpha(consistencyBadge.color, 0.3)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ 
          fontSize: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {consistencyBadge.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
            CONSISTENCY SCORE
          </Typography>
          <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
            <Typography variant="h3" fontWeight={900}>
              {consistencyScore}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              / 100
            </Typography>
            <Chip 
              label={consistencyBadge.label} 
              size="small"
              sx={{ 
                ml: 1,
                fontWeight: 800,
                bgcolor: alpha(consistencyBadge.color, 0.2),
                color: consistencyBadge.color,
                border: `1px solid ${alpha(consistencyBadge.color, 0.4)}`
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Based on your plan usage over the last {chartTimeRange} days
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="text.secondary" display="block">
            Diet: {planUsageAnalytics.dietStats.currentStreak} day streak {planUsageAnalytics.dietStats.currentStreak > 0 && '🔥'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Exercise: {planUsageAnalytics.exerciseStats.currentStreak} day streak {planUsageAnalytics.exerciseStats.currentStreak > 0 && '🔥'}
          </Typography>
        </Box>
      </Paper>
    </Zoom>
  );
};

// ============================================================================
// 2. ADAPTIVE NEXT ACTION
// ============================================================================
export const AdaptiveNextAction = ({ adaptiveNextAction }) => {
  if (!adaptiveNextAction) return null;

  return (
    <Fade in timeout={600}>
      <Paper
        elevation={0}
        onClick={adaptiveNextAction.action}
        sx={{
          mb: 4,
          p: 2.5,
          borderRadius: 3,
          background: (t) => alpha(t.palette[adaptiveNextAction.color].main, 0.05),
          border: (t) => `1px solid ${alpha(t.palette[adaptiveNextAction.color].main, 0.2)}`,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (t) => `0 4px 12px ${alpha(t.palette[adaptiveNextAction.color].main, 0.2)}`,
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ 
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette[adaptiveNextAction.color].main, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${adaptiveNextAction.color}.main`
          }}>
            {adaptiveNextAction.icon}
          </Box>
          <Box flex={1}>
            <Typography variant="overline" fontWeight={800} color={`${adaptiveNextAction.color}.main`}>
              NEXT BEST ACTION
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {adaptiveNextAction.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {adaptiveNextAction.description}
            </Typography>
          </Box>
          <KeyboardArrowUpIcon sx={{ transform: 'rotate(90deg)', color: 'text.secondary' }} />
        </Box>
      </Paper>
    </Fade>
  );
};

// ============================================================================
// 3. HEALTH GOALS WIDGET
// ============================================================================
export const HealthGoalsWidget = ({
  healthGoals,
  expandedSections,
  toggleSection,
  setShowGoalDialog,
  handleDeleteGoal,
  handleUpdateGoalProgress
}) => {
  return (
    <Accordion 
      expanded={expandedSections.includes('goals')}
      onChange={() => toggleSection('goals')}
      sx={{ mb: 4, borderRadius: 3, '&:before': { display: 'none' } }}
      elevation={0}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <FlagIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            My Health Goals
          </Typography>
          <Chip label={healthGoals.length} size="small" />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {healthGoals.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {healthGoals.map(goal => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <Paper key={goal.id} sx={{ p: 2, border: 1, borderColor: 'divider' }} elevation={0}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {goal.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Target: {goal.target} {goal.unit}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleDeleteGoal(goal.id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      type="number"
                      size="small"
                      value={goal.current}
                      onChange={(e) => handleUpdateGoalProgress(goal.id, e.target.value)}
                      sx={{ width: 100 }}
                      InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{goal.unit}</Typography> }}
                    />
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, progress)}
                      sx={{ 
                        flex: 1,
                        height: 8,
                        borderRadius: 999,
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.1)
                      }}
                    />
                    <Typography variant="body2" fontWeight={700}>
                      {Math.round(progress)}%
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No goals set yet. Add a goal to track your progress!
          </Typography>
        )}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowGoalDialog(true)}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Add New Goal
        </Button>
      </AccordionDetails>
    </Accordion>
  );
};

// ============================================================================
// 4. TIME RANGE SELECTOR
// ============================================================================
export const TimeRangeSelector = ({ chartTimeRange, setChartTimeRange }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
      <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
        PLAN CONSISTENCY CHARTS
      </Typography>
      <ToggleButtonGroup
        value={chartTimeRange}
        exclusive
        onChange={(e, val) => val && setChartTimeRange(val)}
        size="small"
        sx={{ bgcolor: 'background.paper' }}
      >
        <ToggleButton value={7}>7 days</ToggleButton>
        <ToggleButton value={14}>14 days</ToggleButton>
        <ToggleButton value={30}>30 days</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

// ============================================================================
// 5. ADD GOAL DIALOG
// ============================================================================
export const AddGoalDialog = ({ 
  showGoalDialog, 
  setShowGoalDialog, 
  newGoal, 
  setNewGoal, 
  handleAddGoal 
}) => {
  return (
    <Dialog open={showGoalDialog} onClose={() => setShowGoalDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Add Health Goal</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Goal Title"
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          sx={{ mt: 2, mb: 2 }}
          placeholder="e.g., Lower HbA1c to 6.5%"
        />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="Target Value"
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Unit"
              value={newGoal.unit}
              onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
              placeholder="e.g., %, kg, days"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowGoalDialog(false)}>Cancel</Button>
        <Button onClick={handleAddGoal} variant="contained">Add Goal</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// 6. DAY DETAILS MODAL
// ============================================================================
export const DayDetailsModal = ({ 
  showDayDetailsModal, 
  setShowDayDetailsModal, 
  selectedDayData 
}) => {
  return (
    <Dialog 
      open={showDayDetailsModal} 
      onClose={() => setShowDayDetailsModal(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Details for {selectedDayData?.label}</Typography>
          <IconButton onClick={() => setShowDayDetailsModal(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedDayData && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Diet Plan
              </Typography>
              {selectedDayData.dietPlan ? (
                <Box>
                  <Typography variant="body2">
                    Calories: {selectedDayData.dietCalories} kcal
                  </Typography>
                  <Typography variant="body2">
                    Carbs: {selectedDayData.dietCarbs}g
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No diet plan for this day
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Exercise Plan
              </Typography>
              {selectedDayData.exercisePlan ? (
                <Box>
                  <Typography variant="body2">
                    Duration: {selectedDayData.exerciseMinutes} minutes
                  </Typography>
                  <Typography variant="body2">
                    Calories burned: {selectedDayData.exerciseCalories} kcal
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No exercise plan for this day
                </Typography>
              )}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDayDetailsModal(false)}>Close</Button>
        <Button variant="contained">Reuse This Plan</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// 7. EXPORT MENU
// ============================================================================
export const ExportMenu = ({ 
  exportMenuAnchor, 
  setExportMenuAnchor, 
  handleExportPDF, 
  handleExportCSV 
}) => {
  return (
    <Menu
      anchorEl={exportMenuAnchor}
      open={Boolean(exportMenuAnchor)}
      onClose={() => setExportMenuAnchor(null)}
    >
      <MenuItem onClick={handleExportPDF}>
        <ListItemIcon>
          <PictureAsPdfIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Export as PDF</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleExportCSV}>
        <ListItemIcon>
          <TableChartIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Export data (CSV)</ListItemText>
      </MenuItem>
    </Menu>
  );
};

// ============================================================================
// 8. KEYBOARD SHORTCUTS DIALOG
// ============================================================================
export const KeyboardShortcutsDialog = ({ 
  showKeyboardShortcuts, 
  setShowKeyboardShortcuts 
}) => {
  return (
    <Dialog open={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)}>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemText 
              primary="Refresh Data" 
              secondary="Press R"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Show Shortcuts" 
              secondary="Press ?"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Export CSV" 
              secondary="Ctrl + E"
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowKeyboardShortcuts(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// 9. QUICK NAVIGATION SPEED DIAL
// ============================================================================
export const QuickNavigationSpeedDial = ({ 
  scrollToSection, 
  diagnosisRef, 
  labsRef, 
  analyticsRef, 
  plansRef, 
  assessmentRef 
}) => {
  return (
    <SpeedDial
      ariaLabel="Jump to section"
      sx={{ position: 'fixed', bottom: 24, right: 24 }}
      icon={<SpeedDialIcon />}
    >
      <SpeedDialAction
        icon={<HealingIcon />}
        tooltipTitle="Diagnosis"
        onClick={() => scrollToSection(diagnosisRef)}
      />
      <SpeedDialAction
        icon={<ScienceIcon />}
        tooltipTitle="Labs & Vitals"
        onClick={() => scrollToSection(labsRef)}
      />
      <SpeedDialAction
        icon={<AssessmentIcon />}
        tooltipTitle="Analytics"
        onClick={() => scrollToSection(analyticsRef)}
      />
      <SpeedDialAction
        icon={<FitnessCenterIcon />}
        tooltipTitle="Plan Charts"
        onClick={() => scrollToSection(plansRef)}
      />
      <SpeedDialAction
        icon={<AssessmentIcon />}
        tooltipTitle="Assessment"
        onClick={() => scrollToSection(assessmentRef)}
      />
    </SpeedDial>
  );
};

// ============================================================================
// 10. HEADER WITH EXPORT AND SHORTCUTS
// ============================================================================
export const InsightsHeader = ({ setShowKeyboardShortcuts, setExportMenuAnchor }) => {
  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            mb: 1,
            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.4px',
          }}
        >
          Diabetes Insights
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
          A focused snapshot of your diabetes profile, latest health data,
          and next best steps—all in one clean, professional view.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Tooltip title="Keyboard shortcuts (?)">
          <IconButton 
            size="small" 
            onClick={() => setShowKeyboardShortcuts(true)}
            sx={{ border: 1, borderColor: 'divider' }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Button
          size="small"
          startIcon={<GetAppIcon />}
          onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Export
        </Button>
      </Box>
    </Box>
  );
};
