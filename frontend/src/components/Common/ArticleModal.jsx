import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentBySlug } from '../../utils/api';

const ArticleModal = ({ 
  open, 
  onClose, 
  article, 
  onArticleClick 
}) => {
  const theme = useTheme();
  const { formatDate } = useDateFormat();
  const [fullArticle, setFullArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && article) {
      loadFullArticle();
    }
  }, [open, article]);

  const loadFullArticle = async () => {
    if (!article?.slug) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContentBySlug(article.slug);
      setFullArticle(data);
    } catch (error) {
      console.error('Error loading full article:', error);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFullArticle(null);
    setError(null);
    onClose();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.1
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh',
              background: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.15)}`,
            }
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <DialogTitle
              sx={{
                p: 3,
                pb: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    onClick={handleClose}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.2),
                      }
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Typography variant="h6" fontWeight={600}>
                    Article Details
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleClose}
                  sx={{
                    background: alpha(theme.palette.error.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.error.main, 0.2),
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : fullArticle ? (
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Featured Image */}
                  {fullArticle.featuredImage?.url && (
                    <Box
                      sx={{
                        width: '100%',
                        height: 300,
                        backgroundImage: `url(${fullArticle.featuredImage.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                        }
                      }}
                    />
                  )}

                  <Box sx={{ p: 3 }}>
                    {/* Category and Featured Badge */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {fullArticle.category && (
                        <Chip
                          label={fullArticle.category.name}
                          sx={{
                            backgroundColor: fullArticle.category.color || theme.palette.primary.main,
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {fullArticle.isFeatured && (
                        <Chip label="Featured" color="primary" />
                      )}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      gutterBottom
                      sx={{
                        mb: 2,
                        lineHeight: 1.3,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {fullArticle.title}
                    </Typography>

                    {/* Meta Information */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '0.875rem',
                          }}
                        >
                          {fullArticle.author?.fullName?.charAt(0) || 'A'}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {fullArticle.author?.fullName || 'Admin'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(fullArticle.publishedAt || fullArticle.createdAt)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ViewIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {fullArticle.viewCount || 0} views
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Excerpt */}
                    {fullArticle.excerpt && (
                      <Typography
                        variant="h6"
                        color="text.secondary"
                        sx={{
                          mb: 3,
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          background: alpha(theme.palette.primary.main, 0.05),
                          p: 2,
                          borderRadius: 2,
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        {fullArticle.excerpt}
                      </Typography>
                    )}

                    {/* Content */}
                    <Box
                      sx={{
                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          mb: 2,
                          mt: 3,
                        },
                        '& p': {
                          mb: 2,
                          lineHeight: 1.8,
                          color: theme.palette.text.primary,
                        },
                        '& ul, & ol': {
                          mb: 2,
                          pl: 3,
                        },
                        '& li': {
                          mb: 1,
                          lineHeight: 1.6,
                        },
                        '& blockquote': {
                          borderLeft: `4px solid ${theme.palette.primary.main}`,
                          pl: 2,
                          ml: 0,
                          fontStyle: 'italic',
                          background: alpha(theme.palette.primary.main, 0.05),
                          p: 2,
                          borderRadius: 2,
                          mb: 2,
                        },
                        '& img': {
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: 2,
                          mb: 2,
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: fullArticle.content }}
                    />
                  </Box>
                </motion.div>
              ) : null}
            </DialogContent>

            {/* Actions */}
            <DialogActions
              sx={{
                p: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                background: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    sx={{ borderRadius: 2 }}
                  >
                    Share
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BookmarkIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Save
                  </Button>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleClose}
                  sx={{
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                    },
                  }}
                >
                  Close
                </Button>
              </Box>
            </DialogActions>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ArticleModal;

