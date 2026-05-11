import React, { useEffect, useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Pagination,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Avatar,
    Fade,
    Zoom,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    CartesianGrid,
    BarChart,
    Bar,
    Cell,
    Legend,
    Area,
    AreaChart,
} from 'recharts';
import { toast } from 'react-toastify';
import { fetchAuditLogs, fetchAuditAnalytics, exportAuditLogs } from '../utils/api';

const actionOptions = ['all', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT'];
const resourceOptions = [
    'all',
    'User',
    'UserPersonalInfo',
    'UserMedicalInfo',
    'Disease',
    'Symptom',
    'Question',
    'Content',
    'Role',
    'Permission',
    'Feedback',
    'DietPlan',
    'ExercisePlan',
    'Document',
    'Assessment',
];
const statusOptions = ['all', 'SUCCESS', 'FAILURE', 'PARTIAL'];

// Color mapping for status
const statusColors = {
    SUCCESS: '#10b981',
    FAILURE: '#ef4444',
    PARTIAL: '#f59e0b',
};

// Color mapping for actions
const actionColors = {
    CREATE: '#3b82f6',
    READ: '#10b981',
    UPDATE: '#f59e0b',
    DELETE: '#ef4444',
    EXPORT: '#8b5cf6',
    IMPORT: '#06b6d4',
    LOGIN: '#84cc16',
    LOGOUT: '#f97316',
};

// Styled components for premium, classy look
const StatsCard = styled(Card)(({ theme }) => ({
    borderRadius: '12px',
    boxShadow: theme.palette.mode === 'dark' 
        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0, 0, 0, 0.4)'
            : '0 4px 16px rgba(0, 0, 0, 0.12)',
    },
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
    borderRadius: '12px',
    boxShadow: theme.palette.mode === 'dark'
        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'box-shadow 0.3s',
    border: `1px solid ${theme.palette.divider}`,
}));

export default function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [filters, setFilters] = useState({
        user_email: '',
        action: 'all',
        resource: 'all',
        status: 'all',
        startDate: '',
        endDate: '',
    });

    // Detail modal
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    // Fetch logs
    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Build params object without undefined values
            const params = { page, limit };
            
            if (filters.user_email) params.user_email = filters.user_email;
            if (filters.action && filters.action !== 'all') params.action = filters.action;
            if (filters.resource && filters.resource !== 'all') params.resource = filters.resource;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const response = await fetchAuditLogs(params);

            if (response.success) {
                setLogs(response.data);
                setTotal(response.pagination.total);
                setTotalPages(response.pagination.totalPages);
            }
        } catch (error) {
            toast.error('Failed to fetch audit logs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics
    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            // Build params object without undefined values
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            
            const response = await fetchAuditAnalytics(params);

            if (response.success) {
                setAnalytics(response.data);
            }
        } catch (error) {
            toast.error('Failed to fetch analytics');
            console.error(error);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLogs();
        fetchAnalytics();
    }, [page, filters]);

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1); // Reset to page 1 when filtering
    };

    // Handle refresh
    const handleRefresh = () => {
        setPage(1);
        fetchLogs();
        fetchAnalytics();
    };

    // Handle export
    const handleExport = async (format) => {
        setExporting(true);
        try {
            const response = await exportAuditLogs(
                {
                    format,
                    user_email: filters.user_email || undefined,
                    action: filters.action !== 'all' ? filters.action : undefined,
                    resource: filters.resource !== 'all' ? filters.resource : undefined,
                    status: filters.status !== 'all' ? filters.status : undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                },
                format
            );

            if (format === 'csv' && response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().getTime()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

            toast.success(`Audit logs exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export audit logs');
            console.error(error);
        } finally {
            setExporting(false);
        }
    };

    // View detail
    const handleViewDetail = (log) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedLog(null);
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    // Prepare chart data
    const chartData = analytics?.eventsByHour?.map((item) => ({
        time: item._id,
        events: item.count,
    })) || [];

    const actionChartData = analytics?.eventsByAction?.map((item) => ({
        name: item._id,
        value: item.count,
    })) || [];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={900} gutterBottom color="text.primary">
                        Audit Logs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track and monitor all system activities
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <IconButton onClick={handleRefresh} disabled={loading || analyticsLoading}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => handleExport('csv')}
                        disabled={exporting || logs.length === 0}
                        sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 2 } }}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={() => handleExport('json')}
                        disabled={exporting || logs.length === 0}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Export JSON
                    </Button>
                </Box>
            </Box>

            {/* Key Metrics */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Total Events
                                    </Typography>
                                    <Avatar sx={{ bgcolor: alpha('#1976d2', 0.1), color: '#1976d2', width: 44, height: 44 }}>
                                        <EventIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                    {analyticsLoading ? <CircularProgress size={28} /> : analytics?.totalEvents || 0}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TrendingUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">All time</Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Success Rate
                                    </Typography>
                                    <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 44, height: 44 }}>
                                        <CheckCircleIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                    {analyticsLoading ? <CircularProgress size={28} /> : `${analytics?.successRate || 0}%`}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TrendingUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">Success operations</Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Failed Operations
                                    </Typography>
                                    <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', width: 44, height: 44 }}>
                                        <ErrorIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                    {analyticsLoading ? <CircularProgress size={28} /> : analytics?.failedOps || 0}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ErrorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">Need attention</Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Today's Events
                                    </Typography>
                                    <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: 44, height: 44 }}>
                                        <TrendingUpIcon />
                                    </Avatar>
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                    {analyticsLoading ? (
                                        <CircularProgress size={28} />
                                    ) : (
                                        logs.filter(
                                            (l) =>
                                                new Date(l.timestamp).toDateString() ===
                                                new Date().toDateString()
                                        ).length
                                    )}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EventIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">Last 24 hours</Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: (t) => `1px solid ${t.palette.divider}`,
                            height: '100%',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Activity by Hour
                            </Typography>
                            <Chip 
                                label="Last 7 Days" 
                                size="small" 
                                sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '11px'
                                }}
                            />
                        </Box>
                        {analyticsLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <CircularProgress />
                            </Box>
                        ) : chartData.length === 0 ? (
                            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={350}>
                                <EventIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">No activity data available</Typography>
                                <Typography variant="caption" color="text.disabled">Perform actions to see hourly patterns</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#764ba2" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis 
                                        dataKey="time" 
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        allowDecimals={false}
                                    />
                                    <ReTooltip 
                                        contentStyle={{
                                            background: 'rgba(255, 255, 255, 0.98)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            padding: '12px 16px'
                                        }}
                                        labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: '4px' }}
                                        itemStyle={{ color: '#667eea', fontSize: '13px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="events" 
                                        stroke="#667eea" 
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorEvents)"
                                        name="Events"
                                        dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            border: (t) => `1px solid ${t.palette.divider}`,
                            height: '100%',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Events by Type
                            </Typography>
                            <Chip 
                                label={`${actionChartData.length} Types`} 
                                size="small" 
                                sx={{ 
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '11px'
                                }}
                            />
                        </Box>
                        {analyticsLoading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <CircularProgress />
                            </Box>
                        ) : actionChartData.length === 0 ? (
                            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={350}>
                                <BarChartIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">No event type data available</Typography>
                                <Typography variant="caption" color="text.disabled">Different actions will appear here</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={actionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        {actionChartData.map((entry, index) => {
                                            const colors = [
                                                ['#667eea', '#764ba2'],
                                                ['#f093fb', '#f5576c'],
                                                ['#4facfe', '#00f2fe'],
                                                ['#43e97b', '#38f9d7'],
                                                ['#fa709a', '#fee140'],
                                                ['#30cfd0', '#330867'],
                                                ['#a8edea', '#fed6e3'],
                                                ['#ff9a9e', '#fecfef'],
                                            ];
                                            const colorPair = colors[index % colors.length];
                                            return (
                                                <linearGradient key={`gradient-${index}`} id={`colorBar${index}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={colorPair[0]} stopOpacity={1}/>
                                                    <stop offset="95%" stopColor={colorPair[1]} stopOpacity={0.9}/>
                                                </linearGradient>
                                            );
                                        })}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        angle={-15}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        allowDecimals={false}
                                    />
                                    <ReTooltip 
                                        contentStyle={{
                                            background: 'rgba(255, 255, 255, 0.98)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            padding: '12px 16px'
                                        }}
                                        labelStyle={{ color: '#1e293b', fontWeight: 600, marginBottom: '4px' }}
                                        cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                        name="Count"
                                    >
                                        {actionChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`url(#colorBar${index})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 3,
                    background: (t) => t.palette.background.paper,
                    border: (t) => `1px solid ${t.palette.divider}`,
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="User Email"
                            placeholder="Search by email..."
                            value={filters.user_email}
                            onChange={(e) => handleFilterChange('user_email', e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                label="Action"
                            >
                                {actionOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {opt === 'all' ? 'All Actions' : opt}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Resource</InputLabel>
                            <Select
                                value={filters.resource}
                                onChange={(e) => handleFilterChange('resource', e.target.value)}
                                label="Resource"
                            >
                                {resourceOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {opt === 'all' ? 'All Resources' : opt}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                label="Status"
                            >
                                {statusOptions.map((opt) => (
                                    <MenuItem key={opt} value={opt}>
                                        {opt === 'all' ? 'All Status' : opt}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            type="datetime-local"
                            label="End Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Logs Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: (t) => `1px solid ${t.palette.divider}`,
                }}
            >
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                        <CircularProgress size={60} />
                    </Box>
                ) : logs.length === 0 ? (
                    <Box display="flex" justifyContent="center" p={5}>
                        <Typography color="text.secondary">No audit logs found</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>User Email</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log._id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {formatTimestamp(log.timestamp)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar 
                                                            sx={{ 
                                                                width: 32, 
                                                                height: 32,
                                                                bgcolor: alpha('#1976d2', 0.1),
                                                                color: '#1976d2',
                                                                fontSize: '0.875rem',
                                                            }}
                                                        >
                                                            {log.user_email.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Typography variant="body2">{log.user_email}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.action}
                                                        size="small"
                                                        sx={{
                                                            background: alpha(actionColors[log.action] || '#999', 0.15),
                                                            color: actionColors[log.action] || '#999',
                                                            fontWeight: 600,
                                                            borderRadius: '8px',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {log.resource}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.status}
                                                        size="small"
                                                        icon={log.status === 'SUCCESS' ? <CheckCircleIcon /> : <ErrorIcon />}
                                                        sx={{
                                                            background: alpha(statusColors[log.status] || '#999', 0.15),
                                                            color: statusColors[log.status] || '#999',
                                                            fontWeight: 600,
                                                            borderRadius: '8px',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                        {log.ip_address || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="View Details" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewDetail(log)}
                                                            color="primary"
                                                        >
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
                            <Typography variant="body2" color="text.secondary">
                                Showing {logs.length} of {total} logs
                            </Typography>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, value) => setPage(value)}
                                color="primary"
                                size="small"
                            />
                        </Box>
                    </>
                )}
            </Paper>

            {/* Detail Modal */}
            <Dialog 
                open={detailOpen} 
                onClose={handleCloseDetail} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 700,
                }}>
                    Audit Log Details
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {selectedLog && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box sx={{ 
                                p: 2, 
                                borderRadius: '8px', 
                                bgcolor: 'action.hover',
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                            }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                    Timestamp
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                    {formatTimestamp(selectedLog.timestamp)}
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            User Email
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                            {selectedLog.user_email}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            User Role
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                            {(selectedLog.user_role || []).join(', ')}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            Action
                                        </Typography>
                                        <Chip
                                            label={selectedLog.action}
                                            size="small"
                                            sx={{
                                                mt: 1,
                                                background: alpha(actionColors[selectedLog.action] || '#999', 0.15),
                                                color: actionColors[selectedLog.action] || '#999',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            Resource
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                            {selectedLog.resource}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            Status
                                        </Typography>
                                        <Chip
                                            label={selectedLog.status}
                                            size="small"
                                            icon={selectedLog.status === 'SUCCESS' ? <CheckCircleIcon /> : <ErrorIcon />}
                                            sx={{
                                                mt: 1,
                                                background: alpha(statusColors[selectedLog.status] || '#999', 0.15),
                                                color: statusColors[selectedLog.status] || '#999',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            Resource ID
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, wordBreak: 'break-all', color: 'text.primary' }}>
                                            {selectedLog.resource_id || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ 
                                        p: 2, 
                                        borderRadius: '8px', 
                                        bgcolor: 'action.hover',
                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                    }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                            IP Address
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                            {selectedLog.ip_address || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            {selectedLog.error_message && (
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: alpha('#ef4444', 0.05),
                                    border: (theme) => `1px solid ${alpha('#ef4444', 0.2)}`,
                                }}>
                                    <Typography variant="caption" color="error" sx={{ fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ErrorIcon fontSize="small" />
                                        Error Message
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, color: 'error.main', fontWeight: 500 }}>
                                        {selectedLog.error_message}
                                    </Typography>
                                </Box>
                            )}
                            {selectedLog.changes && (
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: 'action.hover',
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                                        Changes
                                    </Typography>
                                    <Typography
                                        component="pre"
                                        variant="body2"
                                        sx={{
                                            mt: 1,
                                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc',
                                            color: 'text.primary',
                                            p: 2,
                                            borderRadius: '8px',
                                            overflow: 'auto',
                                            maxHeight: 300,
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button 
                        onClick={handleCloseDetail}
                        variant="contained"
                        sx={{
                            borderRadius: '8px',
                            px: 3,
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
