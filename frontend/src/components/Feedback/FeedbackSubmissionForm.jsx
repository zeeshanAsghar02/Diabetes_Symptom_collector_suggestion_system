import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Rating,
  Alert,
  CircularProgress,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { submitFeedback, updateFeedbackById } from '../../utils/api';
import { toast } from 'react-toastify';

export default function FeedbackSubmissionForm({ onSuccess, onCancel, initialData }) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || '');
  const [isAnonymous, setIsAnonymous] = useState(initialData?.is_anonymous || false);
  const categoryList = [
    'Overall System Experience',
    'Onboarding Process',
    'Assessment Feature',
    'Dashboard Experience',
    'Content & Resources (CMS)',
    'Technical Aspects',
    'Open Feedback',
  ];
  const [categoryRatings, setCategoryRatings] = useState(() => {
    const existing = initialData?.category_ratings || {};
    const mapped = {};
    categoryList.forEach((cat) => {
      mapped[cat] = existing[cat] || 0;
    });
    return mapped;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 0);
      setComment(initialData.comment || '');
      setIsAnonymous(initialData.is_anonymous || false);
      const existing = initialData.category_ratings || {};
      setCategoryRatings((prev) => {
        const mapped = {};
        categoryList.forEach((cat) => {
          mapped[cat] = existing[cat] || 0;
        });
        return mapped;
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please provide a rating');
      return;
    }

    setLoading(true);
    try {
      if (initialData?._id) {
        // Update existing feedback
        await updateFeedbackById(initialData._id, rating, comment || null, isAnonymous, categoryRatings);
        toast.success('Feedback updated successfully!');
      } else {
        // Submit new feedback
        await submitFeedback(rating, comment || null, isAnonymous, categoryRatings);
        toast.success('Feedback submitted successfully!');
      }
      // Reset form
      setRating(0);
      setComment('');
      setIsAnonymous(false);
      setCategoryRatings(() => {
        const reset = {};
        categoryList.forEach((c) => (reset[c] = 0));
        return reset;
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || (initialData?._id ? 'Failed to update feedback' : 'Failed to submit feedback');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        background: 'rgba(17,24,39,0.78)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'none',
      }}
    >
      <Typography variant="h5" fontWeight={560} sx={{ mb: 1, color: '#fff', letterSpacing: '-0.045em' }}>
        {initialData?._id ? 'Edit Your Feedback' : 'Share Your Feedback'}
      </Typography>
      <Typography variant="body2" sx={{ mb: 4, color: 'rgba(203,213,225,0.62)' }}>
        Help us improve by sharing your experience. Your feedback is valuable to us.
      </Typography>

      <form onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(251,146,60,0.1)', color: '#fed7aa' }}>
            {error}
          </Alert>
        )}

        {/* Rating */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={640} sx={{ mb: 1.5, color: '#fff' }}>
            Overall Rating <span style={{ color: '#f87171' }}>*</span>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.025)',
            }}
          >
            <Rating
              name="rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              size="large"
              sx={{
                '& .MuiRating-iconFilled': {
                  color: '#fbbf24',
                  filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.28))',
                },
                '& .MuiRating-iconEmpty': {
                  color: 'rgba(255,255,255,0.1)',
                },
              }}
            />
            {rating > 0 && (
              <Typography variant="body1" fontWeight={520} sx={{ color: 'rgba(203,213,225,0.66)' }}>
                {rating} {rating === 1 ? 'star' : 'stars'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Comment */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={640} sx={{ mb: 1.5, color: '#fff' }}>
            Comments or Suggestions (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts, suggestions, or any issues you encountered..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'rgba(2,6,23,0.55)',
                color: '#fff',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                '&:hover fieldset': { borderColor: 'rgba(45,212,191,0.28)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(45,212,191,0.55)' },
                '& textarea': { color: '#fff' },
                '& textarea::placeholder': { color: 'rgba(203,213,225,0.44)', opacity: 1 },
              },
            }}
          />
        </Box>

        {/* Category Ratings Grid */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={640} sx={{ mb: 1.5, color: '#fff' }}>
            Category Ratings (Optional)
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {categoryList.map((cat) => (
              <Paper
                key={cat}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(2,6,23,0.35)',
                }}
              >
                <Typography variant="body2" fontWeight={620} sx={{ mb: 1, color: 'rgba(203,213,225,0.68)' }}>
                  {cat}
                </Typography>
                <Rating
                  name={`rating-${cat}`}
                  value={categoryRatings[cat] || 0}
                  onChange={(_, val) => {
                    setCategoryRatings((prev) => ({ ...prev, [cat]: val || 0 }));
                  }}
                  precision={1}
                  sx={{
                    '& .MuiRating-iconFilled': { color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.28))' },
                    '& .MuiRating-iconEmpty': { color: 'rgba(255,255,255,0.1)' },
                  }}
                />
              </Paper>
            ))}
          </Box>
        </Box>

        {/* Anonymous Toggle */}
        <Box sx={{ mb: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                sx={{
                  color: 'primary.main',
                  '&.Mui-checked': {
                    color: '#2dd4bf',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.62)' }}>
                Submit anonymously (Your feedback will be visible to others, but your name will be hidden)
              </Typography>
            }
          />
        </Box>

        {/* Buttons */}
        <Box display="flex" gap={2} justifyContent="flex-end">
          {onCancel && (
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                color: 'rgba(203,213,225,0.78)',
                borderColor: 'rgba(255,255,255,0.1)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="outlined"
            disabled={loading || rating === 0}
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 720,
              px: 4,
              color: '#fff',
              borderColor: 'rgba(34,211,238,0.3)',
              '&:hover': { borderColor: 'rgba(45,212,191,0.7)', bgcolor: 'rgba(45,212,191,0.08)' },
              '&.Mui-disabled': { color: 'rgba(148,163,184,0.38)', borderColor: 'rgba(255,255,255,0.06)' },
            }}
          >
            {loading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} color="inherit" />
                {initialData?._id ? 'Updating...' : 'Submitting...'}
              </Box>
            ) : (
              initialData?._id ? 'Update Feedback' : 'Submit Feedback'
            )}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

