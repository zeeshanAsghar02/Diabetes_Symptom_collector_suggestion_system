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
  Stack,
  useTheme,
  alpha,
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
          minHeight: { xs: 420, md: 520 },
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.background.paper, 0.78)} 100%)`
            : `linear-gradient(180deg, ${alpha('#ffffff', 0.98)} 0%, ${alpha('#f8fbff', 0.94)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.14 : 0.08)}`,
          borderRadius: 6,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0,0,0,0.32)'
            : '0 16px 40px rgba(21, 32, 80, 0.10)',
          backdropFilter: 'blur(18px)',
          '&:hover': {
            transform: 'translateY(-10px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 28px 50px rgba(0,0,0,0.4)'
              : '0 24px 50px rgba(21, 32, 80, 0.14)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {article.featuredImage?.url ? (
            <CardMedia
              component="img"
              image={article.featuredImage.url}
              alt={article.featuredImage.alt || article.title}
              sx={{
                height: { xs: 180, md: 240 },
                position: 'relative',
                zIndex: 1,
                objectFit: 'cover',
                transition: 'transform 0.55s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          ) : (
            <Box
              sx={{
                height: { xs: 180, md: 240 },
                background: (t) => `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.9)} 0%, ${alpha(t.palette.secondary.main, 0.85)} 100%)`,
              }}
            />
          )}

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8, 15, 32, 0.02) 0%, rgba(8, 15, 32, 0.55) 100%)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              left: 18,
              right: 18,
              bottom: 18,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              alignItems: 'flex-end',
              zIndex: 2,
            }}
          >
            {article.category && (
              <Chip
                label={article.category.name}
                size="small"
                sx={{
                  background: article.category.color || `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  color: 'white',
                  fontWeight: 700,
                  px: 0.5,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.18)',
                }}
              />
            )}
            {article.isFeatured && (
              <Chip
                label="Editor’s pick"
                size="small"
                sx={{
                  background: alpha('#ffffff', 0.15),
                  color: 'common.white',
                  fontWeight: 700,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                }}
              />
            )}
          </Box>
        </Box>

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
          <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component="h2" 
              sx={{
                fontWeight: 800,
                lineHeight: 1.22,
                color: theme.palette.text.primary,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '1.15rem',
              }}
            >
              {article.title}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                lineHeight: 1.7,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flexGrow: 1,
                fontSize: '0.94rem',
              }}
            >
              {truncateText(article.excerpt, 145)}
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 2,
              p: 1.4,
              borderRadius: 4,
              background: (t) => alpha(t.palette.background.default, t.palette.mode === 'dark' ? 0.24 : 0.78),
              border: (t) => `1px solid ${alpha(t.palette.divider, 0.08)}`,
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  {formatDate(article.publishedAt || article.createdAt)}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  {article.author?.fullName || 'Admin'}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <ViewIcon fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  {article.viewCount || 0} views
                </Typography>
              </Box>
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
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                width: '100%',
                py: 1.15,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, 0.28)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  boxShadow: `0 14px 28px ${alpha(theme.palette.primary.main, 0.38)}`,
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
