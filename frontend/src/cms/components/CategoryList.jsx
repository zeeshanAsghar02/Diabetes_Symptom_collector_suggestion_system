import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { fetchCategories, deleteCategory } from '../../utils/api';
import CategoryForm from './CategoryForm';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null });
  const [searchTerm, setSearchTerm] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Fetch all categories for admin view (no status filter)
      const data = await fetchCategories('all');
      // Handle different response formats
      const categoriesData = Array.isArray(data) ? data : (data?.data || data || []);
      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category) => {
    setDeleteDialog({ open: true, category });
  };

  const confirmDelete = async () => {
    try {
      await deleteCategory(deleteDialog.category._id);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setDeleteDialog({ open: false, category: null });
    }
  };

  const handleFormSuccess = () => {
    loadCategories();
    toast.success(selectedCategory ? 'Category updated successfully' : 'Category created successfully');
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add Category
        </Button>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search categories"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            placeholder="Search by name or description..."
          />
        </CardContent>
      </Card>

      {filteredCategories.length === 0 ? (
        <Alert severity="info">
          No categories found. Create your first category to get started.
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ width: '100%' }}>
          {filteredCategories.map((category) => (
            <Grid item xs={12} sm={4} md={4} lg={4} key={category._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  border: '1px solid',
                  borderColor: 'divider',
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
                <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                  <Box 
                    display="flex" 
                    alignItems="flex-start" 
                    mb={2}
                    gap={2}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 1.5,
                        backgroundColor: category.color || 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box flexGrow={1} minWidth={0}>
                      <Typography 
                        variant="h6" 
                        component="h2"
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {category.name}
                      </Typography>
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        color={category.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, mb: 2, minHeight: '60px' }}>
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
                      }}
                    >
                      {category.description || 'No description'}
                    </Typography>
                  </Box>
                  
                  <Box 
                    display="flex" 
                    gap={1}
                    sx={{
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      justifyContent: 'flex-end',
                      mt: 'auto'
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(category)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(category)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onClose={handleFormClose}
        category={selectedCategory}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.category?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>
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

export default CategoryList;
