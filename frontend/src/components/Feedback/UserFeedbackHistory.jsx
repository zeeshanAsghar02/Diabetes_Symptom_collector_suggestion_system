import React, { useState, useEffect, useCallback } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import FeedbackSubmissionForm from './FeedbackSubmissionForm';
import { fetchMyFeedback, deleteFeedbackById } from '../../utils/api';
import { toast } from 'react-toastify';

const categoryList = [
  'Overall System Experience',
  'Onboarding Process',
  'Assessment Feature',
  'Dashboard Experience',
  'Content & Resources (CMS)',
  'Technical Aspects',
  'Open Feedback',
];

export default function UserFeedbackHistory({ showFormOnMount = false, showForm: controlledShowForm, onShowFormChange }) {
  const { formatDate } = useDateFormat();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [internalShowForm, setInternalShowForm] = useState(showFormOnMount);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const showForm = controlledShowForm !== undefined ? controlledShowForm : internalShowForm;
  const setShowForm = useCallback((value) => {
    if (onShowFormChange) onShowFormChange(value);
    if (controlledShowForm === undefined) setInternalShowForm(value);
  }, [controlledShowForm, onShowFormChange]);

  useEffect(() => {
    loadFeedback();
  }, []);

  // Update form visibility when prop changes
  useEffect(() => {
    if (showFormOnMount) {
      setShowForm(true);
    }
  }, [showFormOnMount, setShowForm]);

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyFeedback();
      setFeedback(data.feedback || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load your feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleNewFeedback = () => {
    setEditingFeedback(null);
    setShowForm(true);
  };

  const handleEditFeedback = (item) => {
    setEditingFeedback(item);
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.id) return;
    try {
      await deleteFeedbackById(deleteDialog.id);
      toast.success('Feedback deleted successfully');
      setDeleteDialog({ open: false, id: null });
      loadFeedback();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingFeedback(null);
    loadFeedback();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFeedback(null);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      if (index < rating) {
        return <StarIcon key={index} sx={{ color: '#FFB800', fontSize: '1.2rem' }} />;
      }
      return <StarBorderIcon key={index} sx={{ color: 'text.disabled', fontSize: '1.2rem' }} />;
    });
  };


  // Derived user stats for a lightweight header
  const totalCount = feedback.length;
  const averageRating =
    totalCount > 0 ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalCount).toFixed(2) : '0.00';
  const latestDate =
    totalCount > 0
      ? formatDate(
          feedback
            .slice()
            .sort((a, b) => new Date(b.submitted_on) - new Date(a.submitted_on))[0]?.submitted_on
        )
      : null;

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3,
          background: (t) => t.palette.background.paper,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              Your Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share what feels helpful, confusing, or missing in your Diavise experience.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewFeedback}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
            }}
          >
            Submit New Feedback
          </Button>
        </Box>

        {/* Quick stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            mt: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) => t.palette.background.default,
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Total submissions
            </Typography>
            <Typography variant="h5" fontWeight={800}>{totalCount}</Typography>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) => t.palette.background.default,
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Avg rating
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <StarIcon sx={{ color: '#FFB800', fontSize: 20 }} />
              <Typography variant="h5" fontWeight={800}>{averageRating}</Typography>
            </Box>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
              background: (t) => t.palette.background.default,
            }}
          >
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
              Most recent
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {latestDate || '—'}
            </Typography>
          </Paper>
        </Box>
      </Paper>

      {/* Feedback Form */}
      {showForm && (
        <Box sx={{ mb: 4 }}>
          <FeedbackSubmissionForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            initialData={editingFeedback}
          />
        </Box>
      )}

      {/* Feedback List */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : feedback.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: (t) => t.palette.background.paper,
            border: (t) => `1px dashed ${t.palette.divider}`,
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            No Feedback Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tell us what could be improved in your care dashboard, plans, assessment, or AI assistant.
          </Typography>
          <Button
            variant="contained"
            onClick={handleNewFeedback}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Submit Your First Feedback
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {feedback.map((item) => (
            <Paper
              key={item._id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: (t) => t.palette.background.paper,
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: '0 6px 22px rgba(0,0,0,0.06)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.10)',
                },
              }}
            >
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Box sx={{ flex: 1 }}>
                  {/* Rating and Date */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {renderStars(item.rating)}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(item.submitted_on)}
                    </Typography>
                  </Box>

                  {/* Comment */}
                  {item.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      {item.comment}
                    </Typography>
                  )}

                  {/* Category ratings (if any) */}
                  {item.category_ratings && Object.keys(item.category_ratings).length > 0 && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr' },
                        gap: 1,
                        mb: 1.5,
                        mt: 1,
                      }}
                    >
                      {categoryList.map((cat) => {
                        const val = item.category_ratings?.[cat];
                        if (!val) return null;
                        return (
                          <Paper
                            key={cat}
                            elevation={0}
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              border: (t) => `1px solid ${t.palette.divider}`,
                              background: (t) => t.palette.background.default,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary' }}>
                              {cat}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              {renderStars(val)}
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  )}

                  {/* Anonymous Badge */}
                  {item.is_anonymous && (
                    <Chip
                      label="Submitted anonymously"
                      size="small"
                      sx={{ mt: 1, fontWeight: 600, color: 'text.secondary', borderRadius: 2 }}
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Actions */}
                <Box display="flex" gap={1}>
                  <Tooltip title="Edit feedback">
                    <IconButton
                      size="small"
                      onClick={() => handleEditFeedback(item)}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete feedback">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(item._id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Delete Feedback</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this feedback? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
