import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  Paper,
  Modal,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import FeedbackCard from '../components/Feedback/FeedbackCard';
import FeedbackStats from '../components/Feedback/FeedbackStats';
import { fetchAllFeedback, fetchFeedbackStats } from '../utils/api';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/Sort';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';

export default function CommunityFeedbackDashboard() {
  const [user, setUser] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [whyOpen, setWhyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const navigate = useNavigate();

  // Derived analytics
  const averageRating = stats?.averageRating || 0;
  const totalFeedback = stats?.totalFeedback || 0;
  const categoryEntries = stats?.categoryAverages
    ? Object.entries(stats.categoryAverages).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    : [];
  const topCategory = categoryEntries[0]?.[0] || 'Overall System Experience';
  const topCategoryScore = categoryEntries[0]?.[1] || 0;

  const ratingMood =
    averageRating >= 4.5
      ? 'Outstanding community satisfaction'
      : averageRating >= 4
      ? 'Great momentum—keep it up'
      : averageRating >= 3
      ? 'Mixed feedback—opportunity to improve'
      : 'Needs attention—let’s address gaps';

  useEffect(() => {
    checkAuth();
    loadData();
  }, [page]);

  const checkAuth = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      // User not logged in - that's okay for viewing feedback
      setUser(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [feedbackData, statsData] = await Promise.all([
        fetchAllFeedback(page, 10),
        fetchFeedbackStats(),
      ]);
      setFeedback(feedbackData.feedback || []);
      setTotalPages(feedbackData.pagination?.pages || 1);
      setStats(statsData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleGiveFeedback = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    // Navigate to Dashboard with query param to show feedback form
    navigate('/dashboard?showFeedback=true');
  };

  // Filters / search / sort (client-side on current page data)
  const categoryList = [
    'Overall System Experience',
    'Onboarding Process',
    'Assessment Feature',
    'Dashboard Experience',
    'Content & Resources (CMS)',
    'Technical Aspects',
    'Open Feedback',
  ];

  const filteredFeedback = feedback
    .filter((item) => {
      // search in comment and user name
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const haystack = `${item.comment || ''} ${item.user?.fullName || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      // rating filter (exact)
      if (ratingFilter !== 'all' && item.rating !== Number(ratingFilter)) return false;
      // category filter (requires rating present)
      if (categoryFilter !== 'all') {
        const hasCat = item.category_ratings && item.category_ratings[categoryFilter];
        if (!hasCat) return false;
      }
      // date filter
      if (dateFilter !== 'all') {
        const submitted = new Date(item.submitted_on);
        const now = new Date();
        const diffDays = (now - submitted) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7' && diffDays > 7) return false;
        if (dateFilter === '30' && diffDays > 30) return false;
        if (dateFilter === '365' && diffDays > 365) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.submitted_on) - new Date(a.submitted_on);
      }
      if (sortOption === 'highest') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortOption === 'helpful') {
        // fallback heuristic: higher rating + longer comment
        const score = (fb) => (fb.rating || 0) * 10 + (fb.comment ? fb.comment.length / 50 : 0);
        return score(b) - score(a);
      }
      return 0;
    });

  const displayedFeedback = filteredFeedback;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: 10,
        pb: 6,
        background: (t) => t.palette.background.default,
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: (t) =>
              t.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.background.paper} 100%)`
                : `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.background.paper} 100%)`,
            border: (t) => `1px solid ${t.palette.divider}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: (t) => t.palette.primary.main,
              opacity: 0.08,
              filter: 'blur(12px)',
            }}
          />

          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={3}>
            <Box flex={1}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.4 }}>
                Community Voices
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ mt: 1, mb: 1 }}>
                Your feedback shapes better care for everyone
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
                Share your experience to help others make informed decisions, spotlight what works, and guide us to
                improve faster. You can stay anonymous while still making a real impact.
              </Typography>

              <Box display="flex" gap={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
                {[
                  'Help future users avoid pitfalls',
                  'Highlight what’s genuinely useful',
                  'Shape product decisions that matter',
                  'Stay anonymous if you prefer',
                ].map((chip) => (
                  <Paper
                    key={chip}
                    elevation={0}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      border: (t) => `1px solid ${t.palette.divider}`,
                      background: (t) => t.palette.background.paper,
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    {chip}
                  </Paper>
                ))}
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleGiveFeedback}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 3, py: 1.25 }}
                >
                  Share Feedback
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setWhyOpen(true)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, py: 1.25 }}
                >
                  Why it matters
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: (t) => t.palette.background.paper,
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <ForumIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  Community Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Share your experience and see what others are saying
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleGiveFeedback}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                py: 1.5,
              }}
            >
              {user ? 'Give Feedback' : 'Login to Give Feedback'}
            </Button>
          </Box>
        </Paper>

        {/* Filters & Search */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: (t) => t.palette.background.paper,
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search feedback or users"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Rating</InputLabel>
                <Select
                  value={ratingFilter}
                  label="Filter by Rating"
                  onChange={(e) => setRatingFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterAltIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r} stars
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Filter by Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  {categoryList.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date</InputLabel>
                <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                  <MenuItem value="all">Any time</MenuItem>
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="365">Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sortOption}
                  label="Sort"
                  onChange={(e) => setSortOption(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="highest">Highest rated</MenuItem>
                  <MenuItem value="helpful">Most helpful*</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            * Most helpful uses a heuristic (rating + comment depth) until helpful votes are available.
          </Typography>
        </Paper>

        {/* Feedback List (moved up for visibility right after filters) */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : displayedFeedback.length === 0 ? (
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
              Be the first to share your feedback!
            </Typography>
            <Button
              variant="contained"
              onClick={handleGiveFeedback}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {user ? 'Submit Feedback' : 'Login to Submit'}
            </Button>
          </Paper>
        ) : (
          <>
            <Box
              sx={{
                mb: 3,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              {displayedFeedback.map((item) => (
                <FeedbackCard key={item._id} feedback={item} />
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* Statistics */}
        {stats && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 1.5, md: 2 },
              borderRadius: 4,
              background: (t) => t.palette.background.paper,
              border: (t) => `1px solid ${t.palette.divider}`,
              boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
            }}
          >
            <FeedbackStats stats={stats} />
          </Paper>
        )}

        {/* Community Insights */}
        {stats && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 4,
              background: (t) => t.palette.background.paper,
              border: (t) => `1px solid ${t.palette.divider}`,
              boxShadow: '0 12px 28px rgba(0,0,0,0.06)',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
              <Typography variant="h6" fontWeight={900}>
                Community Insights
              </Typography>
              <Chip
                label={ratingMood}
                color={averageRating >= 4 ? 'success' : averageRating >= 3 ? 'warning' : 'error'}
                variant="outlined"
                sx={{ fontWeight: 800, borderRadius: 2 }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: (t) => alpha(t.palette.success.main, 0.08),
                    border: (t) => `1px solid ${alpha(t.palette.success.main, 0.25)}`,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                    height: '100%',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <AutoAwesomeIcon color="success" />
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Avg Rating
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Typography variant="h4" fontWeight={900}>
                      {averageRating.toFixed ? averageRating.toFixed(2) : Number(averageRating).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /5
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Based on {totalFeedback} submissions
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: (t) => alpha(t.palette.info.main, 0.08),
                    border: (t) => `1px solid ${alpha(t.palette.info.main, 0.25)}`,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                    height: '100%',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <LeaderboardIcon color="info" />
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Top Category
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
                    {topCategory}
                  </Typography>
                  <Box display="flex" alignItems="baseline" gap={1}>
                    <Typography variant="h4" fontWeight={900}>
                      {topCategoryScore.toFixed ? topCategoryScore.toFixed(2) : Number(topCategoryScore).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /5
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Highest community-rated area
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    background: (t) => alpha(t.palette.secondary.main, 0.08),
                    border: (t) => `1px solid ${alpha(t.palette.secondary.main, 0.25)}`,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                    height: '100%',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <VolunteerActivismIcon color="secondary" />
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>
                      Why contribute?
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                    Help new users find what works, highlight wins, and flag gaps so we can improve faster—while staying
                    anonymous if you want.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleGiveFeedback}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 800 }}
                  >
                    Share your voice
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        )}


        {/* Why it matters modal */}
        <Modal open={whyOpen} onClose={() => setWhyOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 520 },
              bgcolor: 'background.paper',
              color: 'text.primary',
              borderRadius: 3,
              boxShadow: 24,
              p: 4,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
              Why your feedback matters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
              Every submission helps other users understand what works, highlights issues for us to fix faster,
              and guides our roadmap toward what you value most. You can stay anonymous while still making an
              impact.
            </Typography>
            <Box component="ul" sx={{ pl: 2.5, mb: 3, lineHeight: 1.7, color: 'text.secondary' }}>
              <li>Surface real-world wins and pain points quickly</li>
              <li>Help new users make confident choices</li>
              <li>Directly influence what we improve next</li>
              <li>Optionally stay anonymous—your voice, your choice</li>
            </Box>
            <Box display="flex" gap={1.5} justifyContent="flex-end">
              <Button variant="text" onClick={() => setWhyOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setWhyOpen(false);
                  handleGiveFeedback();
                }}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
              >
                Share Feedback
              </Button>
            </Box>
          </Box>
        </Modal>

      </Container>
    </Box>
  );
}

