import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchContent, fetchCategories } from '../../utils/api';
import BlogCard from './BlogCard';

const BlogSection = ({ 
  title = "Latest Health Articles",
  subtitle = "Stay informed with expert insights on diabetes management and healthy living",
  showFilters = true,
  limit = 6,
  featuredFirst = true,
  onArticleClick
}) => {
  const theme = useTheme();
  const tc = theme.palette.brandTelecare || {};
  const displayFont =
    theme.typography.marketingHeadline?.fontFamily || theme.typography.fontFamily;
  const navigate = useNavigate();
  const { formatDate } = useDateFormat();
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 3, // Show only 3 articles on landing page
    total: 0,
    pages: 0
  });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: 1,
        limit: 3, // Only load 3 articles for landing page
        status: 'published',
        search: searchTerm,
        category: selectedCategory,
        sort: '-publishedAt'
      };
      
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });
      
      const data = await fetchContent(params);
      setContent(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        pages: data.pages || 0
      }));
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
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleViewAllArticles = () => {
    navigate('/articles');
  };

  const handleArticleClick = (article) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      setSelectedArticle(article);
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  // Separate featured and regular articles
  const featuredArticles = content.filter(article => article.isFeatured);
  const regularArticles = content.filter(article => !article.isFeatured);
  const allArticles = featuredFirst ? [...featuredArticles, ...regularArticles] : content;
  // Always show only 3 articles on landing page
  const displayArticles = allArticles;

  if (loading && content.length === 0) {
    return (
      <Box
        sx={{
          py: 10,
          mt: { xs: 4, md: 6 },
          mb: { xs: 4, md: 6 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box
      id="blogs-articles"
      component="section"
      sx={{
        scrollMarginTop: { xs: '96px', md: '112px' },
        py: { xs: 9, sm: 10, md: 11, lg: 12 },
        mt: { xs: 4, md: 6 },
        mb: { xs: 4, md: 6 },
        bgcolor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { xs: 2.5, sm: 3, md: 4 },
        }}
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {/* Section Header — matches landing marketing type (Poppins display + Inter body) */}
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
            <motion.div variants={itemVariants}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: displayFont,
                  fontWeight: 800,
                  color: 'text.primary',
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 1.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                component="p"
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 400,
                  color: 'text.secondary',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.65,
                  maxWidth: 640,
                  mx: 'auto',
                  px: { xs: 1, sm: 0 },
                }}
              >
                {subtitle}
              </Typography>
            </motion.div>
          </Box>

          {/* Search and Filter */}
          {showFilters && (
            <motion.div variants={itemVariants}>
              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  mb: { xs: 4, md: 5 },
                  borderRadius: 3,
                  background:
                    theme.palette.mode === 'light'
                      ? alpha(tc.cyan || theme.palette.info.main, 0.06)
                      : alpha(tc.cyan || theme.palette.info.main, 0.1),
                  border: `1px solid ${alpha(tc.cyan || theme.palette.divider, 0.18)}`,
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 2px 14px rgba(15, 23, 42, 0.06)'
                      : '0 2px 14px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search articles"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        label="Category"
                        sx={{ borderRadius: 2 }}
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
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="action" />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: theme.typography.fontFamily, fontWeight: 500 }}
                      >
                        {pagination.total} articles found
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div variants={itemVariants}>
              <Alert severity="error" sx={{ mb: 4 }}>
                {error}
              </Alert>
            </motion.div>
          )}

          {/* Articles Grid */}
          {content.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Alert severity="info">
                No articles found. Try adjusting your search criteria.
              </Alert>
            </motion.div>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: { xs: 2.5, md: 3.5 },
                  width: '100%',
                }}
              >
                {displayArticles.map((article, index) => (
                  <Box
                    key={article._id}
                    sx={{ 
                      display: 'flex',
                      width: '100%'
                    }}
                  >
                    <BlogCard
                      article={article}
                      onReadMore={handleArticleClick}
                      index={index}
                      variant={article.isFeatured && featuredFirst ? 'featured' : 'default'}
                    />
                  </Box>
                ))}
              </Box>
              
              {/* View All Articles Button */}
              {pagination.total > 3 && (
                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 5, md: 7 } }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleViewAllArticles}
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        fontFamily: theme.typography.fontFamily,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: { xs: '1rem', md: '1.0625rem' },
                        px: { xs: 4, sm: 5 },
                        py: 1.5,
                        color: tc.onGradient || '#FFFFFF',
                        background:
                          tc.navPillGradient ||
                          `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 8px 24px ${alpha(tc.cyan || theme.palette.primary.main, 0.32)}`,
                        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 32px ${alpha(tc.cyan || theme.palette.primary.main, 0.4)}`,
                        },
                      }}
                    >
                      View All Articles
                    </Button>
                  </Box>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
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
        {selectedArticle && (
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
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
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
        )}
      </Dialog>
    </Box>
  );
};

export default BlogSection;
