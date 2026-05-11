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
import { alpha } from '@mui/material/styles';
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
        background: (t) => t.palette.background.paper,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        {initialData?._id ? 'Edit Your Feedback' : 'Share Your Feedback'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Help us improve by sharing your experience. Your feedback is valuable to us.
      </Typography>

      <form onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Rating */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            Overall Rating <span style={{ color: 'red' }}>*</span>
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              background: (t) => alpha(t.palette.primary.main, 0.04),
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
                  color: '#FFB800',
                },
                '& .MuiRating-iconEmpty': {
                  color: 'text.disabled',
                },
              }}
            />
            {rating > 0 && (
              <Typography variant="body1" fontWeight={600} color="text.secondary">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Comment */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
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
              },
            }}
          />
        </Box>

        {/* Category Ratings Grid */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
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
                  border: (t) => `1px solid ${t.palette.divider}`,
                  background: (t) => t.palette.background.paper,
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
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
                    '& .MuiRating-iconFilled': { color: '#FFB800' },
                    '& .MuiRating-iconEmpty': { color: 'text.disabled' },
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
                    color: 'primary.main',
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
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
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || rating === 0}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4 }}
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

