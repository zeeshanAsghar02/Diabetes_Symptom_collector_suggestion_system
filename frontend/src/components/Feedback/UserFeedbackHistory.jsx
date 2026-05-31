import React, { useState, useEffect, useCallback } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tooltip,
  Typography,
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

  useEffect(() => {
    if (showFormOnMount) setShowForm(true);
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

  const renderStars = (rating) => (
    Array.from({ length: 5 }, (_, index) => (
      index < rating
        ? <StarIcon key={index} sx={{ color: '#fbbf24', fontSize: '1rem', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.28))' }} />
        : <StarBorderIcon key={index} sx={{ color: 'rgba(255,255,255,0.1)', fontSize: '1rem' }} />
    ))
  );

  const totalCount = feedback.length;
  const averageRating =
    totalCount > 0 ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalCount).toFixed(2) : '0.00';
  const latestDate =
    totalCount > 0
      ? formatDate(feedback.slice().sort((a, b) => new Date(b.submitted_on) - new Date(a.submitted_on))[0]?.submitted_on)
      : null;

  return (
    <Box sx={{ color: '#f8fafc' }}>
      <Box sx={{ mb: 3.5 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={560} sx={{ mb: 0.5, color: '#fff', letterSpacing: '-0.045em' }}>
              Your Feedback
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
              Share what feels helpful, confusing, or missing in your Diavise experience.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleNewFeedback}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 720,
              px: 2.4,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.025)',
              borderColor: 'rgba(34,211,238,0.3)',
              boxShadow: 'none',
              '&:hover': {
                borderColor: 'rgba(45,212,191,0.7)',
                bgcolor: 'rgba(45,212,191,0.08)',
                boxShadow: '0 0 28px rgba(45,212,191,0.12)',
              },
            }}
          >
            Submit New Feedback
          </Button>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 0,
            mt: 3.2,
          }}
        >
          <Box sx={{ py: 1.5, pr: { xs: 0, sm: 3 } }}>
            <Typography variant="overline" sx={{ fontWeight: 740, color: 'rgba(148,163,184,0.72)', letterSpacing: '0.14em' }}>
              Total submissions
            </Typography>
            <Typography variant="h5" fontWeight={380} sx={{ color: '#fff', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
              {totalCount}
            </Typography>
          </Box>
          <Box
            sx={{
              py: 1.5,
              px: { xs: 0, sm: 3 },
              borderLeft: { xs: 'none', sm: '1px solid rgba(255,255,255,0.1)' },
              mt: { xs: 1.5, sm: 0 },
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 740, color: 'rgba(148,163,184,0.72)', letterSpacing: '0.14em' }}>
              Avg rating
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <StarIcon sx={{ color: '#fbbf24', fontSize: 17, filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.28))' }} />
              <Typography variant="h5" fontWeight={380} sx={{ color: '#fff', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
                {averageRating}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              py: 1.5,
              pl: { xs: 0, sm: 3 },
              borderLeft: { xs: 'none', sm: '1px solid rgba(255,255,255,0.1)' },
              mt: { xs: 1.5, sm: 0 },
            }}
          >
            <Typography variant="overline" sx={{ fontWeight: 740, color: 'rgba(148,163,184,0.72)', letterSpacing: '0.14em' }}>
              Most recent
            </Typography>
            <Typography variant="body1" fontWeight={380} sx={{ color: '#fff', fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' }}>
              {latestDate || '-'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {showForm && (
        <Box sx={{ mb: 4 }}>
          <FeedbackSubmissionForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            initialData={editingFeedback}
          />
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress sx={{ color: '#2dd4bf' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3, bgcolor: 'rgba(251,146,60,0.1)', color: '#fed7aa' }}>
          {error}
        </Alert>
      ) : feedback.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            background: 'rgba(17,24,39,0.72)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <Typography variant="h6" fontWeight={560} sx={{ mb: 2, color: '#fff' }}>
            No Feedback Yet
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'rgba(203,213,225,0.62)' }}>
            Tell us what could be improved in your care dashboard, plans, assessment, or AI assistant.
          </Typography>
          <Button
            variant="outlined"
            onClick={handleNewFeedback}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 720,
              color: '#fff',
              borderColor: 'rgba(34,211,238,0.3)',
              '&:hover': { borderColor: 'rgba(45,212,191,0.7)', bgcolor: 'rgba(45,212,191,0.08)' },
            }}
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
                background: 'rgba(17,24,39,0.78)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'none',
                transition: 'transform 0.18s ease, background 0.18s ease, border-color 0.18s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  background: 'rgba(17,24,39,0.92)',
                  borderColor: 'rgba(255,255,255,0.09)',
                },
              }}
            >
              <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={0.35}>
                      {renderStars(item.rating)}
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.76)' }}>
                      {formatDate(item.submitted_on)}
                    </Typography>
                  </Box>

                  {item.comment && (
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.65, color: 'rgba(203,213,225,0.72)' }}>
                      {item.comment}
                    </Typography>
                  )}

                  {item.category_ratings && Object.keys(item.category_ratings).length > 0 && (
                    <Box sx={{ display: 'grid', gap: 0.35, mb: 1.5, mt: 1 }}>
                      {categoryList.map((cat) => {
                        const val = item.category_ratings?.[cat];
                        if (!val) return null;
                        return (
                          <Box
                            key={cat}
                            sx={{
                              py: 0.85,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                            }}
                          >
                            <Typography variant="caption" fontWeight={640} sx={{ color: 'rgba(203,213,225,0.58)' }}>
                              {cat}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={0.35}>
                              {renderStars(val)}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {item.is_anonymous && (
                    <Chip
                      label="Submitted anonymously"
                      size="small"
                      sx={{ mt: 1, fontWeight: 600, color: 'rgba(203,213,225,0.62)', borderRadius: 2, borderColor: 'rgba(255,255,255,0.08)' }}
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box display="flex" gap={0.5}>
                  <Tooltip title="Edit feedback">
                    <IconButton
                      size="small"
                      onClick={() => handleEditFeedback(item)}
                      sx={{
                        color: 'rgba(148,163,184,0.46)',
                        '& svg': { fontSize: 19 },
                        '&:hover': { color: '#60a5fa', bgcolor: 'rgba(96,165,250,0.08)' },
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete feedback">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(item._id)}
                      sx={{
                        color: 'rgba(148,163,184,0.46)',
                        '& svg': { fontSize: 19 },
                        '&:hover': { color: '#f87171', bgcolor: 'rgba(248,113,113,0.08)' },
                      }}
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

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        PaperProps={{
          sx: {
            bgcolor: '#0b0f19',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            boxShadow: '0 24px 80px rgba(2,6,23,0.45)',
          },
        }}
      >
        <DialogTitle>Delete Feedback</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(203,213,225,0.72)' }}>
            Are you sure you want to delete this feedback? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })} sx={{ color: 'rgba(203,213,225,0.7)' }}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="text">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
