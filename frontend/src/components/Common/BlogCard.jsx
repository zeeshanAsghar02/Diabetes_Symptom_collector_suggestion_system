import React from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Box,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const BlogCard = ({ 
  article, 
  onReadMore, 
  index = 0
}) => {
  const theme = useTheme();
  const { formatDate } = useDateFormat();

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut'
      }
    }
  };

  const hoverVariants = {
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    }
  };

  // Variants could be used for future layout adjustments

  return (
    <motion.div
      variants={{ ...cardVariants, ...hoverVariants }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover="hover"
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: '100%',
          height: '100%',
          minHeight: 480,
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: theme.shadows[12],
            border: `1px solid ${theme.palette.primary.main}40`,
          },
        }}
      >
        {/* Featured Image */}
        {article.featuredImage?.url && (
          <CardMedia
            component="img"
            height={200}
            image={article.featuredImage.url}
            alt={article.featuredImage.alt || article.title}
            sx={{
              position: 'relative',
              zIndex: 1,
              transition: 'transform 0.4s ease',
              objectFit: 'cover',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />
        )}

        <CardContent 
          sx={{ 
            flexGrow: 1, 
            position: 'relative', 
            zIndex: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Category and Featured Badge */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="flex-start" 
            mb={1.5}
          >
            {article.category && (
              <Chip
                label={article.category.name}
                size="small"
                sx={{ 
                  backgroundColor: article.category.color || theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            )}
            {article.isFeatured && (
              <Chip 
                label="Featured" 
                color="primary" 
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          
          {/* Title */}
          <Typography 
            variant="h6" 
            component="h2" 
            gutterBottom
            sx={{
              fontWeight: 700,
              lineHeight: 1.3,
              mb: 1.5,
              color: theme.palette.text.primary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontSize: '1.1rem',
            }}
          >
            {article.title}
          </Typography>
          
          {/* Excerpt */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexGrow: 1,
              fontSize: '0.9rem',
            }}
          >
            {truncateText(article.excerpt, 120)}
          </Typography>
          
          {/* Meta Information */}
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                {formatDate(article.publishedAt || article.createdAt)}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={0.5}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                {article.author?.fullName || 'Admin'}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={0.5}>
              <ViewIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                {article.viewCount || 0} views
              </Typography>
            </Box>
          </Box>
          
          {/* Read More Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={(e) => {
                e.stopPropagation();
                onReadMore(article);
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                width: '100%',
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              Read More
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BlogCard;
