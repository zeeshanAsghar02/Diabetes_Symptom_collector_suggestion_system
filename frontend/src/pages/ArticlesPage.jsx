import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Button,
  useTheme,
  alpha,
  Fade,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Article as ArticleIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchContent, fetchCategories } from '../utils/api';
import BlogCard from '../components/Common/BlogCard';

const ArticlesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { formatDate } = useDateFormat();
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0
  });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const ITEMS_PER_PAGE = 9;

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page,
        limit: ITEMS_PER_PAGE,
        status: 'published',
        search: searchTerm,
        category: selectedCategory,
        sort: '-publishedAt'
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      const data = await fetchContent(params);
      setContent(data.data || []);
      setPagination({
        total: data.total || 0,
        pages: data.pages || 0
      });
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories('active');
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, selectedCategory, page]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleArticleClick = (article) => {
    try {
      console.log('Article clicked:', article);
      console.log('Article has content?', !!article?.content);
      setSelectedArticle(article);
      setOpenModal(true);
    } catch (error) {
      console.error('Error opening article:', error);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setPage(1);
  };

  const featuredArticle = content[0] || null;
  const totalArticles = pagination.total || content.length;
  const readingStats = [
    { label: 'Latest insights', value: 'Fresh weekly', icon: TrendingUpIcon },
    { label: 'Browse depth', value: `${categories.length || 0} topics`, icon: CategoryIcon },
    { label: 'Curated reads', value: `${totalArticles} stories`, icon: ArticleIcon },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: (t) => t.palette.mode === 'dark' 
          ? 'radial-gradient(circle at top left, rgba(41, 171, 226, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(122, 201, 67, 0.12), transparent 28%), linear-gradient(180deg, #091120 0%, #101a33 42%, #0c1322 100%)'
          : 'radial-gradient(circle at top left, rgba(41, 171, 226, 0.14), transparent 26%), radial-gradient(circle at top right, rgba(122, 201, 67, 0.10), transparent 28%), linear-gradient(180deg, #f6f9ff 0%, #eef3fb 46%, #e8edf7 100%)',
        py: { xs: 3, md: 5 },
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -140,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: (t) => `radial-gradient(circle, ${alpha(t.palette.secondary.main, 0.2)} 0%, transparent 68%)`,
            filter: 'blur(10px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 120,
            left: -120,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: (t) => `radial-gradient(circle, ${alpha(t.palette.primary.main, 0.16)} 0%, transparent 68%)`,
            filter: 'blur(12px)',
          }}
        />
      </Box>

      <Container maxWidth="xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={0}
            sx={{
              mb: 3.5,
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 6,
              background: (t) => t.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(t.palette.background.paper, 0.88)} 0%, ${alpha(t.palette.background.paper, 0.65)} 100%)`
                : `linear-gradient(135deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f7fbff', 0.94)} 100%)`,
              border: (t) => `1px solid ${alpha(t.palette.divider, t.palette.mode === 'dark' ? 0.12 : 0.08)}`,
              backdropFilter: 'blur(24px)',
              boxShadow: (t) => `0 24px 60px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.24 : 0.08)}`,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                mb: { xs: 3, md: 4 },
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                px: 2.5,
                py: 1.1,
                borderWidth: 1.5,
                borderColor: (t) => alpha(t.palette.primary.main, 0.28),
                color: 'text.primary',
                background: (t) => alpha(t.palette.background.paper, 0.72),
                backdropFilter: 'blur(10px)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderWidth: 1.5,
                  borderColor: (t) => t.palette.primary.main,
                  background: (t) => alpha(t.palette.primary.main, 0.08),
                  transform: 'translateX(-4px)',
                  boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                }
              }}
            >
              Back to Home
            </Button>

            <Grid container spacing={3} alignItems="stretch">
              <Grid item xs={12} md={7} sx={{ order: { xs: 2, md: 1 } }}>
                <Box sx={{ pr: { md: 2 } }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label="Curated health reading"
                    sx={{
                      mb: 2,
                      px: 0.5,
                      borderRadius: 999,
                      fontWeight: 700,
                      background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.14)} 0%, ${alpha(t.palette.secondary.main, 0.14)} 100%)`,
                      color: 'text.primary',
                      border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                    }}
                  />

                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      lineHeight: 1.05,
                      maxWidth: 760,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '2.4rem', md: '4rem' },
                    }}
                  >
                    Health articles that feel like a premium magazine.
                  </Typography>

                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{
                      mt: 2,
                      maxWidth: 760,
                      fontWeight: 400,
                      lineHeight: 1.7,
                    }}
                  >
                    Explore expert insights on diabetes management, nutrition, fitness, and healthy living through a richer editorial experience.
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3.5 }}>
                    {readingStats.map((stat) => {
                      const Icon = stat.icon;
                      return (
                        <Paper
                          key={stat.label}
                          elevation={0}
                          sx={{
                            px: 2,
                            py: 1.4,
                            borderRadius: 999,
                            minWidth: 150,
                            background: (t) => alpha(t.palette.background.paper, 0.72),
                            border: (t) => `1px solid ${alpha(t.palette.divider, 0.08)}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                          }}
                        >
                          <Box sx={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.16)} 0%, ${alpha(t.palette.secondary.main, 0.16)} 100%)` }}>
                            <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
                              {stat.label}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={800}>
                              {stat.value}
                            </Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={5} sx={{ order: { xs: 1, md: 2 } }}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 5,
                    overflow: 'hidden',
                    position: 'relative',
                    background: (t) => t.palette.mode === 'dark'
                      ? `linear-gradient(160deg, ${alpha(t.palette.background.paper, 0.92)} 0%, ${alpha(t.palette.background.paper, 0.68)} 100%)`
                      : `linear-gradient(160deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f4f8ff', 0.94)} 100%)`,
                    border: (t) => `1px solid ${alpha(t.palette.divider, 0.08)}`,
                    boxShadow: (t) => `0 18px 40px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.22 : 0.08)}`,
                    p: 2.2,
                  }}
                >
                  <Chip
                    label="Featured story"
                    size="small"
                    sx={{
                      mb: 2,
                      borderRadius: 999,
                      fontWeight: 700,
                      background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                      color: 'common.white',
                    }}
                  />

                  {featuredArticle ? (
                    <>
                      <Box
                        sx={{
                          borderRadius: 4,
                          overflow: 'hidden',
                          mb: 2,
                          minHeight: { xs: 180, md: 240 },
                          position: 'relative',
                          background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.88)} 0%, ${alpha(t.palette.secondary.main, 0.84)} 100%)`,
                        }}
                      >
                        {featuredArticle.featuredImage?.url ? (
                          <Box
                            component="img"
                            src={featuredArticle.featuredImage.url}
                            alt={featuredArticle.featuredImage.alt || featuredArticle.title}
                            sx={{ width: '100%', height: { xs: 180, md: 240 }, objectFit: 'cover' }}
                          />
                        ) : null}
                        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 100%)' }} />
                        <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                          {featuredArticle.category && (
                            <Chip
                              label={featuredArticle.category.name}
                              size="small"
                              sx={{ background: alpha('#fff', 0.16), color: 'common.white', backdropFilter: 'blur(10px)', fontWeight: 700 }}
                            />
                          )}
                          <Chip
                            label={`${featuredArticle.viewCount || 0} reads`}
                            size="small"
                            sx={{ background: alpha('#fff', 0.16), color: 'common.white', backdropFilter: 'blur(10px)', fontWeight: 700 }}
                          />
                        </Box>
                      </Box>

                      <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.15, mb: 1.25 }}>
                        {featuredArticle.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
                        {featuredArticle.excerpt || 'A highlighted read from our newest health and wellness collection.'}
                      </Typography>

                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => handleArticleClick(featuredArticle)}
                        sx={{
                          borderRadius: 999,
                          textTransform: 'none',
                          fontWeight: 800,
                          px: 2.5,
                          py: 1.1,
                          background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                          boxShadow: (t) => `0 14px 28px ${alpha(t.palette.primary.main, 0.28)}`,
                        }}
                      >
                        Read featured article
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ minHeight: 240, borderRadius: 4, display: 'grid', placeItems: 'center', background: (t) => alpha(t.palette.background.default, 0.52) }}>
                      <Typography color="text.secondary">Featured article will appear here.</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              mb: 5,
              borderRadius: 999,
              background: (t) => t.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(t.palette.background.paper, 0.82)} 0%, ${alpha(t.palette.background.paper, 0.56)} 100%)`
                : `linear-gradient(135deg, ${alpha('#ffffff', 0.96)} 0%, ${alpha('#f8fbff', 0.9)} 100%)`,
              backdropFilter: 'blur(24px)',
              border: (t) => `1px solid ${alpha(t.palette.divider, t.palette.mode === 'dark' ? 0.14 : 0.08)}`,
              boxShadow: (t) => `0 18px 50px ${alpha(t.palette.common.black, t.palette.mode === 'dark' ? 0.25 : 0.08)}`,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5.4}>
                <TextField
                  fullWidth
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.16)} 0%, ${alpha(t.palette.secondary.main, 0.16)} 100%)`,
                            color: 'primary.main',
                            border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                          }}
                        >
                          <SearchIcon sx={{ fontSize: 20 }} />
                        </Box>
                      </InputAdornment>
                    ),
                    sx: { pl: 0.25 },
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      minHeight: 58,
                      borderRadius: 999,
                      pr: 1.2,
                    },
                    '& .MuiOutlinedInput-root': {
                      background: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.45 : 0.88),
                      boxShadow: (t) => `inset 0 1px 0 ${alpha(t.palette.common.white, 0.7)}`,
                      transition: 'all 0.25s ease',
                      '& fieldset': {
                        borderColor: (t) => alpha(t.palette.divider, 0.12),
                      },
                      '&:hover': {
                        background: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.54 : 0.98),
                        '& fieldset': {
                          borderColor: (t) => alpha(t.palette.primary.main, 0.3),
                        },
                      },
                      '&.Mui-focused': {
                        background: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.58 : 1),
                        boxShadow: (t) => `0 0 0 4px ${alpha(t.palette.primary.main, 0.08)}`,
                        '& fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 1.5,
                        },
                      },
                    },
                    '& input::placeholder': {
                      opacity: 0.78,
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4.2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel shrink>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    label="Category"
                    startAdornment={
                      <InputAdornment position="start" sx={{ mr: 1 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: (t) => `linear-gradient(135deg, ${alpha(t.palette.success.main, 0.16)} 0%, ${alpha(t.palette.info.main, 0.16)} 100%)`,
                            color: 'text.secondary',
                            border: (t) => `1px solid ${alpha(t.palette.divider, 0.12)}`,
                          }}
                        >
                          <CategoryIcon sx={{ fontSize: 20 }} />
                        </Box>
                      </InputAdornment>
                    }
                    renderValue={(value) => value ? categories.find((category) => category._id === value)?.name || 'Category' : 'All Categories'}
                    sx={{
                      minHeight: 58,
                      borderRadius: 999,
                      background: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.45 : 0.88),
                      boxShadow: (t) => `inset 0 1px 0 ${alpha(t.palette.common.white, 0.7)}`,
                      transition: 'all 0.25s ease',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: (t) => alpha(t.palette.divider, 0.12),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: (t) => alpha(t.palette.primary.main, 0.3),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: 1.5,
                      },
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        fontWeight: 600,
                      },
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2.4}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  {(searchTerm || selectedCategory) && (
                    <Chip
                      label="Clear Filters"
                      onDelete={handleClearFilters}
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        borderRadius: 999,
                        px: 0.5,
                        background: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.45 : 0.9),
                        borderColor: (t) => alpha(t.palette.primary.main, 0.18),
                        boxShadow: (t) => `0 8px 20px ${alpha(t.palette.primary.main, 0.08)}`,
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  )}
                  <Chip
                    icon={<ArticleIcon />}
                    label={`${pagination.total} Articles`}
                    color="primary"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 999,
                      px: 0.75,
                      background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 100%)`,
                      color: 'common.white',
                      boxShadow: (t) => `0 10px 24px ${alpha(t.palette.primary.main, 0.28)}`,
                      '& .MuiChip-icon': {
                        color: 'inherit',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Content Section */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={60} />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 3,
              fontSize: '1.1rem'
            }}
          >
            {error}
          </Alert>
        ) : content.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 8,
                textAlign: 'center',
                borderRadius: 4,
                background: (t) => alpha(t.palette.background.paper, 0.6),
                backdropFilter: 'blur(20px)',
              }}
            >
              <ArticleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                No Articles Found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Grid 
                container 
                spacing={4}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)'
                  },
                  gap: 4,
                }}
              >
                {content.map((article, index) => (
                  <motion.div
                    key={article._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{ height: '100%', display: 'flex' }}
                  >
                    <BlogCard
                      article={article}
                      onReadMore={handleArticleClick}
                      index={index}
                    />
                  </motion.div>
                ))}
              </Grid>
            </motion.div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 6,
                    mb: 2
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      background: (t) => alpha(t.palette.background.paper, 0.6),
                      backdropFilter: 'blur(20px)',
                      border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
                    }}
                  >
                    <Pagination
                      count={pagination.pages}
                      page={page}
                      onChange={handlePageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600,
                          fontSize: '1rem',
                        }
                      }}
                    />
                  </Paper>
                </Box>
              </motion.div>
            )}
          </>
        )}
      </Container>

      {/* Article Modal */}
      <Dialog
        open={openModal && selectedArticle !== null}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '90vh',
          }
        }}
      >
        {selectedArticle ? (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                pb: 2,
                background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.05)}, ${alpha(t.palette.secondary.main, 0.05)})`,
              }}
            >
              <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  {selectedArticle.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                  {selectedArticle.category && (
                    <Chip
                      label={selectedArticle.category.name}
                      size="small"
                      sx={{
                        backgroundColor: selectedArticle.category.color || theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {selectedArticle.author && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedArticle.author.fullName || selectedArticle.author.email || 'Admin'}
                      </Typography>
                    </Box>
                  )}
                  {selectedArticle.publishedAt && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(selectedArticle.publishedAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseModal}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                    background: (t) => alpha(t.palette.error.main, 0.1),
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
              {selectedArticle.featuredImage?.url && (
                <Box
                  component="img"
                  src={selectedArticle.featuredImage.url}
                  alt={selectedArticle.featuredImage.alt || selectedArticle.title}
                  sx={{
                    width: '100%',
                    maxHeight: 400,
                    objectFit: 'cover',
                    borderRadius: 3,
                    mb: 3,
                  }}
                />
              )}

              {selectedArticle.excerpt && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 3,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedArticle.excerpt}
                </Typography>
              )}

              {selectedArticle.content ? (
                <Box
                  sx={{
                    lineHeight: 1.8,
                    fontSize: '1.05rem',
                    '& p': { mb: 2 },
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      mt: 3,
                      mb: 2,
                      fontWeight: 700,
                    },
                    '& ul, & ol': {
                      pl: 3,
                      mb: 2,
                    },
                    '& li': {
                      mb: 1,
                    },
                    '& a': {
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      }
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: 2,
                      my: 2,
                    },
                    '& blockquote': {
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      pl: 2,
                      py: 1,
                      my: 2,
                      fontStyle: 'italic',
                      background: (t) => alpha(t.palette.primary.main, 0.05),
                      borderRadius: 1,
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content || '' }}
                />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No content available for this article.
                </Typography>
              )}

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedArticle.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={handleCloseModal}
                variant="contained"
                size="large"
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};

export default ArticlesPage;
