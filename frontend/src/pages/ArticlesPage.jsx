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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (t) => t.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 6 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/')}
              sx={{
                mb: 4,
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.2,
                borderWidth: 2,
                borderColor: (t) => alpha(t.palette.primary.main, 0.3),
                color: 'text.primary',
                background: (t) => alpha(t.palette.background.paper, 0.6),
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: (t) => t.palette.primary.main,
                  background: (t) => alpha(t.palette.primary.main, 0.1),
                  transform: 'translateX(-4px)',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                }
              }}
            >
              Back to Home
            </Button>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <ArticleIcon 
                sx={{ 
                  fontSize: 48, 
                  color: theme.palette.primary.main,
                  filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.4)})`
                }} 
              />
              <Typography
                variant="h3"
                fontWeight={800}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Health & Wellness Articles
              </Typography>
            </Box>
            
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                maxWidth: 700,
                fontWeight: 400,
                lineHeight: 1.6,
                textAlign: 'center',
                mx: 'auto'
              }}
            >
              Explore expert insights on diabetes management, nutrition, fitness, and healthy living
            </Typography>
          </Box>
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
              p: 3,
              mb: 5,
              borderRadius: 4,
              background: (t) => t.palette.mode === 'dark'
                ? alpha(t.palette.background.paper, 0.6)
                : alpha('#ffffff', 0.9),
              backdropFilter: 'blur(20px)',
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.1)}`,
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      background: (t) => alpha(t.palette.background.paper, 0.5),
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    label="Category"
                    startAdornment={
                      <CategoryIcon sx={{ ml: 1, mr: -0.5, color: 'action.active' }} />
                    }
                    sx={{
                      borderRadius: 3,
                      background: (t) => alpha(t.palette.background.paper, 0.5),
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

              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(searchTerm || selectedCategory) && (
                    <Chip
                      label="Clear Filters"
                      onDelete={handleClearFilters}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  <Chip
                    icon={<ArticleIcon />}
                    label={`${pagination.total} Articles`}
                    color="primary"
                    sx={{ fontWeight: 600 }}
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
