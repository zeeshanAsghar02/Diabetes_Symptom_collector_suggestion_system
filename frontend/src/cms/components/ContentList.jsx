import React, { useState, useEffect } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tooltip,
  Popover,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  DeleteSweep as BulkDeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { fetchContent, deleteContent, fetchCategories, updateContent } from '../../utils/api';
import ContentForm from './ContentForm';

const ContentList = () => {
  const { formatDate } = useDateFormat();
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, content: null });
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    status: 'all',
    category: '',
    search: '',
    featured: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [selectedItems, setSelectedItems] = useState([]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
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
      // Clear selection when content changes
      setSelectedItems([]);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    loadContent();
  }, [pagination.page, filters]);

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEdit = (content) => {
    setSelectedContent(content);
    setFormOpen(true);
  };

  const handleDelete = (content) => {
    setDeleteDialog({ open: true, content });
  };

  const confirmDelete = async () => {
    try {
      await deleteContent(deleteDialog.content._id);
      toast.success('Content deleted successfully');
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    } finally {
      setDeleteDialog({ open: false, content: null });
    }
  };

  const handleFormSuccess = () => {
    loadContent();
    toast.success(selectedContent ? 'Content updated successfully' : 'Content created successfully');
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedContent(null);
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearchChange = (event) => {
    setFilters(prev => ({
      ...prev,
      search: event.target.value
    }));
  };

  const handlePageChange = (event, page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === content.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(content.map(item => item._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedItems.map(id => deleteContent(id)));
      toast.success(`${selectedItems.length} item(s) deleted successfully`);
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete some items');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedItems.length === 0) return;

    try {
      // Note: This requires a bulk update endpoint on the backend
      // For now, we'll update items individually
      await Promise.all(
        selectedItems.map(id => 
          updateContent(id, { status: newStatus })
        )
      );
      toast.success(`${selectedItems.length} item(s) updated successfully`);
      loadContent();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error('Failed to update some items');
    }
  };

  const renderReviewStatusChip = (item) => {
    const { reviewStatus, nextReviewDate } = item || {};

    // If backend doesn't provide review fields yet, don't render anything
    if (!reviewStatus && !nextReviewDate) return null;

    let label = 'Needs review';
    let color = 'warning';

    if (reviewStatus === 'reviewed') {
      label = 'Reviewed';
      color = 'success';
    } else if (reviewStatus === 'not_required') {
      label = 'No review';
      color = 'default';
    }

    // If we have a nextReviewDate, refine the label
    if (nextReviewDate) {
      const due = new Date(nextReviewDate);
      const diffDays = Math.round(
        (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (!Number.isNaN(diffDays)) {
        if (diffDays < 0) {
          label = `Overdue ${Math.abs(diffDays)}d`;
          color = 'error';
        } else if (diffDays <= 30) {
          label = `Due in ${diffDays}d`;
          color = 'warning';
        }
      }
    }

    return (
      <Chip
        label={label}
        color={color === 'default' ? 'default' : color}
        size="small"
        variant={color === 'default' ? 'outlined' : 'filled'}
      />
    );
  };

  if (loading && content.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ fontWeight: 700 }}
        >
          Content Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1
          }}
        >
          Add Content
        </Button>
      </Box>

      {/* Icon-Based Search and Filters Row */}
      <Box 
        sx={{ 
          mb: 4,
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Input with Icon */}
        <Tooltip title="Search content by title, description, or keywords" arrow>
          <TextField
            size="small"
            placeholder="Search..."
            value={filters.search}
            onChange={handleSearchChange}
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filters.search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>

        {/* Status Filter Icon */}
        <Tooltip title={`Status: ${filters.status === 'all' ? 'All' : filters.status}`} arrow>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.status}
              onChange={handleFilterChange('status')}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        {/* Category Filter Icon */}
        <Tooltip title={filters.category ? `Category: ${categories.find(c => c._id === filters.category)?.name || 'Selected'}` : 'Filter by category'} arrow>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={filters.category}
              onChange={handleFilterChange('category')}
              displayEmpty
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
        </Tooltip>

        {/* Featured Filter Icon */}
        <Tooltip title={filters.featured === 'true' ? 'Featured only' : filters.featured === 'false' ? 'Not featured' : 'Filter by featured'} arrow>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.featured}
              onChange={handleFilterChange('featured')}
              displayEmpty
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Featured</MenuItem>
              <MenuItem value="false">Not Featured</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        {/* Sort By Icon */}
        <Tooltip title={`Sort: ${filters.sortBy === 'newest' ? 'Newest First' : filters.sortBy === 'oldest' ? 'Oldest First' : filters.sortBy === 'mostViewed' ? 'Most Viewed' : 'Title A-Z'}`} arrow>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={filters.sortBy}
              onChange={handleFilterChange('sortBy')}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="mostViewed">Most Viewed</MenuItem>
              <MenuItem value="title">Title A-Z</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>

        {/* Clear Filters Icon */}
        {(filters.search || filters.status !== 'all' || filters.category || filters.featured || filters.sortBy !== 'newest') && (
          <Tooltip title="Clear all filters" arrow>
            <IconButton
              onClick={() => {
                setFilters({
                  status: 'all',
                  category: '',
                  search: '',
                  featured: '',
                  sortBy: 'newest'
                });
              }}
              sx={{
                backgroundColor: (theme) => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card 
          elevation={0}
          sx={{ 
            mb: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'primary.main',
            background: (theme) => 
              theme.palette.mode === 'dark'
                ? 'rgba(37, 99, 235, 0.15)'
                : 'rgba(37, 99, 235, 0.08)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Typography variant="body1" fontWeight={700} color="primary.main">
                {selectedItems.length} item(s) selected
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleBulkStatusChange('published')}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Publish
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkStatusChange('draft')}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Draft
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleBulkStatusChange('archived')}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Archive
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<BulkDeleteIcon />}
                  onClick={handleBulkDelete}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {content.length === 0 ? (
        <Alert 
          severity="info"
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '1rem'
            }
          }}
        >
          No content found. Create your first content piece to get started.
        </Alert>
      ) : (
        <>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton 
              onClick={handleSelectAll} 
              size="small"
              sx={{
                mr: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }}
            >
              {selectedItems.length === content.length ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
            </IconButton>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {selectedItems.length > 0 ? `${selectedItems.length} item(s) selected` : 'Select all items'}
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            {content.map((item) => (
              <Grid item xs={12} sm={4} md={4} lg={4} key={item._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease-in-out',
                    border: '1px solid',
                    borderColor: selectedItems.includes(item._id) ? 'primary.main' : 'divider',
                    borderWidth: selectedItems.includes(item._id) ? 2 : 1,
                    borderRadius: 3,
                    overflow: 'hidden',
                    minHeight: 0,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => 
                        theme.palette.mode === 'dark' 
                          ? '0px 8px 24px rgba(0, 0, 0, 0.4)' 
                          : '0px 8px 24px rgba(0, 0, 0, 0.12)',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Box 
                    position="relative" 
                    sx={{ 
                      width: '100%', 
                      height: 180,
                      minHeight: 180,
                      maxHeight: 180,
                      overflow: 'hidden',
                      flexShrink: 0
                    }}
                  >
                    {item.featuredImage?.url ? (
                      <CardMedia
                        component="img"
                        image={item.featuredImage.url}
                        alt={item.featuredImage.alt || item.title}
                        sx={{
                          width: '100%',
                          height: 180,
                          minHeight: 180,
                          maxHeight: 180,
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 180,
                          minHeight: 180,
                          maxHeight: 180,
                          background: (theme) => 
                            theme.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)'
                              : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleSelectItem(item._id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { 
                          bgcolor: 'background.paper',
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {selectedItems.includes(item._id) ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                    </IconButton>
                    {item.isFeatured && (
                      <Chip 
                        label="Featured" 
                        color="primary" 
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontWeight: 600,
                          boxShadow: 2,
                        }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    p: 2.5, 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 0
                  }}>
                    {/* Status Chips */}
                    <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                      <Chip
                        label={item.status}
                        color={item.status === 'published' ? 'success' : item.status === 'draft' ? 'warning' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          height: 24
                        }}
                      />
                      {renderReviewStatusChip(item)}
                    </Box>
                    
                    {/* Title */}
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      sx={{ 
                        fontWeight: 600,
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                        fontSize: '1rem',
                        minHeight: '2.8em',
                        maxHeight: '2.8em'
                      }}
                    >
                      {item.title}
                    </Typography>
                    
                    {/* Excerpt */}
                    <Box sx={{ flexGrow: 1, mb: 1.5, minHeight: '4.5em', maxHeight: '4.5em' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.5,
                          fontSize: '0.875rem'
                        }}
                      >
                        {item.excerpt || 'No description available'}
                      </Typography>
                    </Box>
                    
                    {/* Category and Date */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      {item.category && (
                        <Chip
                          label={item.category.name}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 500,
                            height: 24,
                            borderColor: item.category.color || 'primary.main',
                            color: item.category.color || 'primary.main'
                          }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: '0.75rem' }}>
                        {formatDate(item.publishedAt || item.createdAt)}
                      </Typography>
                    </Box>
                    
                    {/* Action Buttons */}
                    <Box 
                      display="flex" 
                      gap={1}
                      sx={{
                        pt: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        justifyContent: 'flex-end',
                        mt: 'auto',
                        flexShrink: 0
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => window.open(`/content/${item.slug}`, '_blank')}
                        color="info"
                        title="View"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'info.light',
                            color: 'info.contrastText',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item)}
                        color="primary"
                        title="Edit"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        color="error"
                        title="Delete"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'error.light',
                            color: 'error.contrastText',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Content Form Dialog */}
      <ContentForm
        open={formOpen}
        onClose={handleFormClose}
        content={selectedContent}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, content: null })}
      >
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.content?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, content: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentList;
