import React, { useEffect, useMemo, useState } from 'react';
import { useDateFormat } from '../hooks/useDateFormat';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import PublishIcon from '@mui/icons-material/Publish';
import HideSourceIcon from '@mui/icons-material/HideSource';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  fetchAdminFeedback,
  fetchAdminFeedbackStats,
  updateAdminFeedbackStatus,
  adminDeleteFeedback,
  adminRestoreFeedback,
} from '../utils/api';
import { toast } from 'react-toastify';

const ratingOptions = ['all', 5, 4, 3, 2, 1];
const statusOptions = ['all', 'published', 'hidden'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

const pieColors = ['#2e7d32', '#fbc02d', '#ef6c00', '#d32f2f', '#6d6d6d'];

// Category colors for bar chart
const categoryColors = ['#1976d2', '#2e7d32', '#fbc02d', '#ef6c00', '#d32f2f', '#9c27b0', '#00acc1'];

// Function to generate abbreviation from category name
const getCategoryAbbreviation = (categoryName) => {
  // Handle special cases
  if (categoryName === 'Content & Resources (CMS)') {
    return 'C&R';
  }
  
  // Take first letter of each word, ignoring special characters
  return categoryName
    .split(/\s+/)
    .map(word => {
      // Remove special characters and get first letter
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      return cleanWord.charAt(0).toUpperCase();
    })
    .join('');
};

export default function AdminFeedback() {
  const { formatDate } = useDateFormat();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listData, setListData] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [dateRange, setDateRange] = useState('30'); // days for stats/time series

  const filters = useMemo(() => {
    const obj = {
      page,
      limit: 10,
      sort,
    };
    if (search.trim()) obj.search = search.trim();
    if (ratingFilter !== 'all') obj.rating = ratingFilter;
    if (statusFilter !== 'all') obj.status = statusFilter;
    return obj;
  }, [page, search, ratingFilter, statusFilter, sort]);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminFeedback(filters);
      setListData(data.feedback || []);
      setPages(data.pagination?.pages || 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchAdminFeedbackStats(dateRange);
      setStats(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load stats');
    }
  };

  useEffect(() => {
    loadList();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const handleStatusToggle = async (id, current) => {
    const nextStatus = current === 'published' ? 'hidden' : 'published';
    try {
      await updateAdminFeedbackStatus(id, nextStatus);
      toast.success(`Marked as ${nextStatus}`);
      loadList();
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminDeleteFeedback(id);
      toast.success('Feedback deleted');
      loadList();
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleRestore = async (id) => {
    try {
      await adminRestoreFeedback(id);
      toast.success('Feedback restored');
      loadList();
      loadStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to restore');
    }
  };

  const ratingPieData = useMemo(() => {
    if (!stats?.ratingCounts) return [];
    return [5, 4, 3, 2, 1].map((r) => ({
      name: `${r} star`,
      value: stats.ratingCounts[r] || 0,
    }));
  }, [stats]);

  const categoryBarData = useMemo(() => {
    if (!stats?.categoryAverages) return [];
    return Object.entries(stats.categoryAverages).map(([k, v], index) => ({
      fullName: k,
      name: getCategoryAbbreviation(k),
      value: v,
      colorIndex: index % categoryColors.length,
    }));
  }, [stats]);

  const timeSeriesData = stats?.timeSeries || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box display="flex" alignItems="center" gap={1}>
        <ForumIcon color="primary" />
        <Typography variant="h5" fontWeight={900}>
          Admin Feedback
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Moderation" />
        <Tab label="Analytics" />
      </Tabs>

      {tab === 0 && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              background: (t) => t.palette.background.paper,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr 1fr', md: '2fr 1fr 1fr 1fr' }} gap={2}>
              <TextField
                size="small"
                placeholder="Search comment or user"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small">
                <InputLabel>Rating</InputLabel>
                <Select
                  value={ratingFilter}
                  label="Rating"
                  onChange={(e) => {
                    setPage(1);
                    setRatingFilter(e.target.value);
                  }}
                >
                  {ratingOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r === 'all' ? 'All' : `${r} stars`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s === 'all' ? 'All' : s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sort}
                  label="Sort"
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value);
                  }}
                >
                  {sortOptions.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={280}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listData.map((fb) => (
                      <TableRow key={fb._id} hover>
                        <TableCell sx={{ minWidth: 140 }}>
                          <Typography variant="body2" fontWeight={700}>
                            {fb.is_anonymous ? 'Anonymous' : fb.user_id?.fullName || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fb.is_anonymous ? '' : fb.user_id?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={`${fb.rating}★`} size="small" color={fb.rating >= 4 ? 'success' : fb.rating >= 3 ? 'warning' : 'error'} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Tooltip title={fb.comment || 'No comment'}>
                            <Typography variant="body2" noWrap>
                              {fb.comment || '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={fb.status}
                            size="small"
                            color={fb.status === 'published' ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(fb.submitted_on)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={fb.status === 'published' ? 'Hide' : 'Publish'}>
                            <IconButton onClick={() => handleStatusToggle(fb._id, fb.status)} size="small">
                              {fb.status === 'published' ? <HideSourceIcon /> : <PublishIcon color="success" />}
                            </IconButton>
                          </Tooltip>
                          {fb.deleted_at ? (
                            <Tooltip title="Restore">
                              <IconButton size="small" onClick={() => handleRestore(fb._id)}>
                                <RestoreFromTrashIcon color="success" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(fb._id)}>
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
              <Button startIcon={<RefreshIcon />} onClick={() => loadList()} size="small" variant="outlined">
                Refresh
              </Button>
              <Pagination
                count={pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="small"
              />
            </Box>
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box display="flex" flexDirection="column" gap={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              background: (t) => t.palette.background.paper,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
              <Typography variant="h6" fontWeight={800}>
                Analytics
              </Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Date Range</InputLabel>
                <Select value={dateRange} label="Date Range" onChange={(e) => setDateRange(e.target.value)}>
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {stats ? (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} gap={1.5} mt={2}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>{stats.totalFeedback}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Published
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>{stats.publishedCount}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Avg Rating
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>{stats.averageRating}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Positive %
                  </Typography>
                  <Typography variant="h6" fontWeight={900}>{stats.positiveRate}%</Typography>
                </Paper>
              </Box>
            ) : (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            )}
          </Paper>

          {stats && (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} gap={2}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Feedback over time
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ReTooltip />
                    <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="avgRating" stroke="#ffb800" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>

              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  Rating distribution
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={ratingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {ratingPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          )}

          {categoryBarData.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                Category averages
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ReTooltip 
                    formatter={(value) => value.toFixed(2)}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                  />
                  <Legend 
                    payload={categoryBarData.map((item, index) => ({
                      value: item.fullName,
                      type: 'rect',
                      id: item.fullName,
                      color: categoryColors[item.colorIndex],
                    }))}
                  />
                  <Bar dataKey="value">
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.colorIndex]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

