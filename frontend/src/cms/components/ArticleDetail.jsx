import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchContentBySlug, fetchRelatedContent } from '../../utils/api';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { formatDate } = useDateFormat();
  const [article, setArticle] = useState(null);
  const [relatedContent, setRelatedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareMenuAnchor, setShareMenuAnchor] = useState(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        setLoading(true);
        const data = await fetchContentBySlug(slug);
        setArticle(data);
        
        // Load related content
        if (data._id) {
          try {
            const related = await fetchRelatedContent(data._id);
            setRelatedContent(related);
          } catch (err) {
            console.error('Error loading related content:', err);
          }
        }
      } catch (err) {
        console.error('Error loading article:', err);
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadArticle();
    }
  }, [slug]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const calculateReadingTime = (content) => {
    if (!content) return 0;
    const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleShareClick = (event) => {
    setShareMenuAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareMenuAnchor(null);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article?.title || '';
    const text = article?.excerpt || '';

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        handleShareClose();
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    handleShareClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !article) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error">
          {error || 'Article not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{ mb: 2 }}
      >
        Back to Articles
      </Button>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            {article.featuredImage?.url && (
              <CardMedia
                component="img"
                height="400"
                image={article.featuredImage.url}
                alt={article.featuredImage.alt || article.title}
              />
            )}
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                {article.category && (
                  <Chip
                    label={article.category.name}
                    sx={{ 
                      backgroundColor: article.category.color,
                      color: 'white'
                    }}
                  />
                )}
                {article.isFeatured && (
                  <Chip label="Featured" color="primary" />
                )}
              </Box>

              <Typography variant="h3" component="h1" gutterBottom>
                {article.title}
              </Typography>

              <Typography variant="h6" color="textSecondary" gutterBottom>
                {article.excerpt}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {article.author?.fullName || 'Admin'}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(article.publishedAt)}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ViewIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="textSecondary">
                          {article.viewCount || 0} views
                        </Typography>
                      </Box>
                      {(article.readingTime || calculateReadingTime(article.content)) > 0 && (
                        <Typography variant="caption" color="textSecondary">
                          {article.readingTime || calculateReadingTime(article.content)} min read
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Tooltip title="Share article">
                    <IconButton onClick={handleShareClick} color="primary">
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={shareMenuAnchor}
                    open={Boolean(shareMenuAnchor)}
                    onClose={handleShareClose}
                  >
                    <MenuItem onClick={() => handleShare('facebook')}>
                      <FacebookIcon sx={{ mr: 1 }} />
                      Share on Facebook
                    </MenuItem>
                    <MenuItem onClick={() => handleShare('twitter')}>
                      <TwitterIcon sx={{ mr: 1 }} />
                      Share on Twitter
                    </MenuItem>
                    <MenuItem onClick={() => handleShare('linkedin')}>
                      <LinkedInIcon sx={{ mr: 1 }} />
                      Share on LinkedIn
                    </MenuItem>
                    <MenuItem onClick={() => handleShare('copy')}>
                      <LinkIcon sx={{ mr: 1 }} />
                      Copy Link
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>

              <Box
                sx={{
                  '& h2': { mt: 3, mb: 2 },
                  '& h3': { mt: 2, mb: 1 },
                  '& p': { mb: 2, lineHeight: 1.7 },
                  '& ul, & ol': { mb: 2, pl: 3 },
                  '& li': { mb: 1 }
                }}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {article.tags && article.tags.length > 0 && (
                <Box mt={4}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {article.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Related Articles */}
          {relatedContent.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Related Articles
                </Typography>
                {relatedContent.map((item) => (
                  <Box
                    key={item._id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => navigate(`/content/${item.slug}`)}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {item.excerpt}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(item.publishedAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SEO Meta Info */}
          {article.seo && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Article Information
                </Typography>
                {article.seo.metaTitle && (
                  <Box mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Meta Title:
                    </Typography>
                    <Typography variant="body2">
                      {article.seo.metaTitle}
                    </Typography>
                  </Box>
                )}
                {article.seo.metaDescription && (
                  <Box mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Meta Description:
                    </Typography>
                    <Typography variant="body2">
                      {article.seo.metaDescription}
                    </Typography>
                  </Box>
                )}
                {article.seo.keywords && article.seo.keywords.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Keywords:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {article.seo.keywords.map((keyword, index) => (
                        <Chip key={index} label={keyword} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArticleDetail;
