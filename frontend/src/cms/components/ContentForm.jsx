import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  Autocomplete,
  Tabs,
  Tab
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { createContent, updateContent, fetchCategories } from '../../utils/api';

const ContentForm = ({ open, onClose, content, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    status: 'draft',
    isFeatured: false,
    featuredImage: {
      url: '',
      alt: ''
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: []
    }
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewTab, setPreviewTab] = useState(0);
  const [scheduledPublishDate, setScheduledPublishDate] = useState(null);

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title || '',
        excerpt: content.excerpt || '',
        content: content.content || '',
        category: content.category?._id || content.category || '',
        tags: content.tags || [],
        status: content.status || 'draft',
        isFeatured: content.isFeatured || false,
        featuredImage: {
          url: content.featuredImage?.url || '',
          alt: content.featuredImage?.alt || ''
        },
        seo: {
          metaTitle: content.seo?.metaTitle || '',
          metaDescription: content.seo?.metaDescription || '',
          keywords: content.seo?.keywords || []
        }
      });
      setScheduledPublishDate(content.publishedAt ? new Date(content.publishedAt) : null);
    } else {
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: [],
        status: 'draft',
        isFeatured: false,
        featuredImage: {
          url: '',
          alt: ''
        },
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: []
        }
      });
      setScheduledPublishDate(null);
    }
    setErrors({});
    setPreviewTab(0);
  }, [content, open]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNestedChange = (parent, field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleTagsChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      tags: newValue
    }));
  };

  const handleKeywordsChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: newValue
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }
    
    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Excerpt is required';
    } else if (formData.excerpt.length > 500) {
      newErrors.excerpt = 'Excerpt cannot exceed 500 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.featuredImage.url && !/^https?:\/\/.+/.test(formData.featuredImage.url)) {
      newErrors.featuredImageUrl = 'Please enter a valid URL';
    }
    
    if (formData.seo.metaTitle && formData.seo.metaTitle.length > 60) {
      newErrors.metaTitle = 'Meta title cannot exceed 60 characters';
    }
    
    if (formData.seo.metaDescription && formData.seo.metaDescription.length > 160) {
      newErrors.metaDescription = 'Meta description cannot exceed 160 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        publishedAt: scheduledPublishDate && scheduledPublishDate > new Date() 
          ? scheduledPublishDate.toISOString() 
          : formData.status === 'published' && !scheduledPublishDate 
            ? new Date().toISOString() 
            : undefined
      };
      
      if (content) {
        await updateContent(content._id, submitData);
      } else {
        await createContent(submitData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save content' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {content ? 'Edit Content' : 'Create New Content'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              required
              fullWidth
            />
            
            <TextField
              label="Excerpt"
              value={formData.excerpt}
              onChange={handleChange('excerpt')}
              error={!!errors.excerpt}
              helperText={errors.excerpt}
              multiline
              rows={3}
              required
              fullWidth
            />
            
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={handleChange('category')}
                label="Category"
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <Typography variant="caption" color="error">
                  {errors.category}
                </Typography>
              )}
            </FormControl>
            
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formData.tags}
              onChange={handleTagsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Add tags..."
                />
              )}
            />
            
            <Tabs value={previewTab} onChange={(e, newValue) => setPreviewTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Edit" />
              <Tab label="Preview" />
            </Tabs>

            {previewTab === 0 ? (
              <TextField
                label="Content"
                value={formData.content}
                onChange={handleChange('content')}
                error={!!errors.content}
                helperText={errors.content}
                multiline
                rows={8}
                required
                fullWidth
              />
            ) : (
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  minHeight: 200,
                  bgcolor: 'background.paper',
                  '& h1, & h2, & h3': { mt: 2, mb: 1 },
                  '& p': { mb: 2, lineHeight: 1.7 },
                  '& ul, & ol': { mb: 2, pl: 3 }
                }}
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFeatured}
                    onChange={handleChange('isFeatured')}
                  />
                }
                label="Featured"
              />
            </Box>

            {formData.status === 'published' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Schedule Publish Date (Optional)"
                  value={scheduledPublishDate}
                  onChange={(newValue) => setScheduledPublishDate(newValue)}
                  minDateTime={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: scheduledPublishDate && scheduledPublishDate > new Date() 
                        ? 'Content will be published at the scheduled time' 
                        : 'Leave empty to publish immediately'
                    }
                  }}
                />
              </LocalizationProvider>
            )}
            
            <Typography variant="h6">Featured Image</Typography>
            <TextField
              label="Image URL"
              value={formData.featuredImage.url}
              onChange={handleNestedChange('featuredImage', 'url')}
              error={!!errors.featuredImageUrl}
              helperText={errors.featuredImageUrl}
              fullWidth
            />
            <TextField
              label="Alt Text"
              value={formData.featuredImage.alt}
              onChange={handleNestedChange('featuredImage', 'alt')}
              fullWidth
            />
            
            <Typography variant="h6">SEO Settings</Typography>
            <TextField
              label="Meta Title"
              value={formData.seo.metaTitle}
              onChange={handleNestedChange('seo', 'metaTitle')}
              error={!!errors.metaTitle}
              helperText={errors.metaTitle}
              fullWidth
            />
            <TextField
              label="Meta Description"
              value={formData.seo.metaDescription}
              onChange={handleNestedChange('seo', 'metaDescription')}
              error={!!errors.metaDescription}
              helperText={errors.metaDescription}
              multiline
              rows={2}
              fullWidth
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formData.seo.keywords}
              onChange={handleKeywordsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="SEO Keywords"
                  placeholder="Add keywords..."
                />
              )}
            />
            
            {errors.submit && (
              <Typography color="error" variant="body2">
                {errors.submit}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Saving...' : (content ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContentForm;
