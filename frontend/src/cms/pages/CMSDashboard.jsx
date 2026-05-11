import React, { useEffect, useMemo, useState } from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import ReactApexChart from 'react-apexcharts';
import { fetchCategoryStats, fetchContentStats, reviewContentApi } from '../../utils/api';

const GlassCard = ({ children, ...props }) => (
  <Card
    elevation={0}
    sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 3,
      border: (t) => `1px solid ${t.palette.divider}`,
      backdropFilter: 'blur(18px)',
      background: (t) =>
        t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.7))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: -120,
        background:
          'radial-gradient(circle at top left, rgba(34,197,94,0.16), transparent 55%), radial-gradient(circle at bottom right, rgba(56,189,248,0.18), transparent 55%)',
        opacity: 0.7,
        pointerEvents: 'none',
      },
      '&:hover': {
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? '0 18px 45px rgba(15,23,42,0.9)'
            : '0 18px 45px rgba(15,23,42,0.15)',
        transform: 'translateY(-2px)',
        transition: 'all 0.22s ease-out',
      },
      transition: 'all 0.18s ease-out',
    }}
    {...props}
  >
    <CardContent sx={{ position: 'relative', zIndex: 1 }}>{children}</CardContent>
  </Card>
);

const MetricTile = ({ icon, label, value, helper, accentColor }) => (
  <GlassCard>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
          {value.toLocaleString()}
        </Typography>
        {helper && (
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2.5,
          bgcolor: (t) =>
            accentColor
              ? `${accentColor}22`
              : t.palette.mode === 'dark'
                ? 'rgba(34,197,94,0.14)'
                : 'rgba(16,185,129,0.08)',
          color: accentColor || 'success.main',
        }}
      >
        {icon}
      </Box>
    </Box>
  </GlassCard>
);

const CMSDashboard = () => {
  const { formatDate } = useDateFormat();
  const [categoryStats, setCategoryStats] = useState(null);
  const [contentStats, setContentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [categories, content] = await Promise.all([
          fetchCategoryStats(),
          fetchContentStats(),
        ]);
        setCategoryStats(categories);
        setContentStats(content);
        setError(null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading CMS dashboard', err);

        if (err?.response?.status === 403) {
          setError({
            type: 'permission',
            message:
              "You don't have permission to view CMS statistics. Ask an admin to grant CMS roles (category:view:all, content:view:all).",
          });
        } else if (err?.response?.status === 401) {
          setError({
            type: 'auth',
            message: 'Your session has expired. Please sign in again.',
          });
        } else {
          setError({
            type: 'error',
            message: 'Unable to load dashboard metrics. Please try again shortly.',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const overview = contentStats?.overview || {};

  const totalContent = overview.totalContent || 0;
  const publishedContent = overview.publishedContent || 0;
  const totalViews = overview.totalViews || 0;

  // Needs review: prefer explicit API field, otherwise use review queue length
  const reviewQueue = Array.isArray(contentStats?.reviewQueue)
    ? contentStats.reviewQueue
    : [];
  const needsReview = overview.needsReview ?? reviewQueue.length ?? 0;

  const averageViews = totalContent > 0 ? Math.round(totalViews / totalContent) : 0;

  // Top performing articles
  const topArticles = useMemo(() => {
    const recent = Array.isArray(contentStats?.recentContent)
      ? contentStats.recentContent
      : [];
    return [...recent]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);
  }, [contentStats?.recentContent]);

  // Views by category
  const viewsByCategory = useMemo(() => {
    const recent = Array.isArray(contentStats?.recentContent)
      ? contentStats.recentContent
      : [];
    const categoryViews = {};
    
    recent.forEach((item) => {
      const catName = item.category?.name || 'Uncategorised';
      categoryViews[catName] = (categoryViews[catName] || 0) + (item.viewCount || 0);
    });

    return Object.entries(categoryViews)
      .map(([name, views]) => ({ name, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [contentStats?.recentContent]);

  // Top articles bar chart
  const topArticlesChartOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: true },
        background: 'transparent',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          dataLabels: {
            position: 'right',
          },
          columnWidth: '60%',
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => val.toLocaleString(),
        style: {
          fontSize: '12px',
          fontWeight: 700,
          colors: ['#fff'],
        },
        offsetX: -5,
      },
      xaxis: {
        categories: topArticles.map((a) => 
          a.title.length > 50 ? a.title.substring(0, 50) + '...' : a.title
        ),
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        title: {
          text: 'Total Views',
          style: {
            fontSize: '13px',
            fontWeight: 700,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
          },
        },
      },
      colors: ['#0ea5e9'],
      grid: {
        borderColor: 'rgba(0,0,0,0.08)',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val.toLocaleString()} views`,
        },
      },
    }),
    [topArticles],
  );

  const topArticlesChartSeries = useMemo(
    () => [
      {
        name: 'Views',
        data: topArticles.map((a) => a.viewCount || 0),
      },
    ],
    [topArticles],
  );

  // Category chart colors
  const categoryChartColors = [
    '#16a34a',
    '#0ea5e9',
    '#22c55e',
    '#a855f7',
    '#f97316',
    '#facc15',
    '#ec4899',
    '#14b8a6',
  ];

  // Category views chart
  const categoryViewsChartOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        height: 350,
        toolbar: { show: true },
        background: 'transparent',
      },
      labels: viewsByCategory.map((c) => c.name),
      legend: {
        position: 'bottom',
        fontSize: '12px',
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) => {
          const total = viewsByCategory.reduce((sum, c) => sum + c.views, 0);
          const value = viewsByCategory[opts.seriesIndex]?.views || 0;
          return `${Math.round(val)}% (${value.toLocaleString()})`;
        },
        style: {
          fontSize: '11px',
          fontWeight: 600,
        },
      },
      colors: categoryChartColors,
      tooltip: {
        y: {
          formatter: (val, opts) => {
            const total = viewsByCategory.reduce((sum, c) => sum + c.views, 0);
            const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return `${val.toLocaleString()} views (${percentage}%)`;
          },
        },
      },
    }),
    [viewsByCategory],
  );

  const categoryViewsChartSeries = useMemo(
    () => viewsByCategory.map((c) => c.views),
    [viewsByCategory],
  );


  const recentContent = Array.isArray(contentStats?.recentContent)
    ? contentStats.recentContent
    : [];

  const handleMarkReviewed = async (itemId) => {
    try {
      await reviewContentApi(itemId, { status: 'reviewed' });
      const fresh = await fetchContentStats();
      setContentStats(fresh);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error marking content as reviewed', e);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Loading diabetes CMS dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity={error.type === 'permission' ? 'warning' : 'error'}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {error.type === 'permission'
              ? 'Access to CMS dashboard is restricted'
              : 'Unable to load dashboard'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
          {error.type === 'permission' && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" fontWeight={700} display="block" gutterBottom>
                Required CMS permissions
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                <Typography component="li" variant="caption" sx={{ fontFamily: 'monospace' }}>
                  category:view:all
                </Typography>
                <Typography component="li" variant="caption" sx={{ fontFamily: 'monospace' }}>
                  content:view:all
                </Typography>
              </Box>
            </Box>
          )}
          {error.type === 'auth' && (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => {
                window.location.href = '/signin';
              }}
            >
              Go to sign-in
            </Button>
          )}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ letterSpacing: 1.2 }} color="success.main">
            Diabetes knowledge CMS
          </Typography>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Clinical content dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor how diabetes education content is performing and which topics need
            clinical review. All graphs and tiles reflect live CMS data.
          </Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1.5}>
          <Chip
            size="small"
            icon={<InsightsIcon sx={{ fontSize: 16 }} />}
            label="Real-time CMS metrics"
            color="success"
            variant="outlined"
          />
          <Chip
            size="small"
            icon={<HealthAndSafetyIcon sx={{ fontSize: 16 }} />}
            label="Diabetes-focused content only"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Top tiles */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricTile
            label="Total articles"
            value={totalContent}
            helper="All diabetes CMS content"
            icon={<ArticleIcon fontSize="small" />}
            accentColor="#16a34a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricTile
            label="Published"
            value={publishedContent}
            helper={
              totalContent
                ? `${Math.round((publishedContent / totalContent) * 100)}% of library`
                : 'No content published yet'
            }
            icon={<ViewIcon fontSize="small" />}
            accentColor="#22c55e"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricTile
            label="Average views / article"
            value={averageViews}
            helper={totalContent ? 'Based on total views and content count' : 'Waiting for data'}
            icon={<InsightsIcon fontSize="small" />}
            accentColor="#0ea5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricTile
            label="Needs clinical review"
            value={needsReview}
            helper="Items in the review queue"
            icon={<HealthAndSafetyIcon fontSize="small" />}
            accentColor="#f97316"
          />
        </Grid>
      </Grid>

      {/* Top Performing Articles - Full Width */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <GlassCard>
            <Box mb={2}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Top Performing Articles
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Most viewed diabetes content - comprehensive analytics
              </Typography>
            </Box>
            {topArticles.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Chart Section - Full Width */}
                <Box sx={{ width: '100%' }}>
                  <ReactApexChart
                    options={topArticlesChartOptions}
                    series={topArticlesChartSeries}
                    type="bar"
                    height={350}
                  />
                </Box>

                {/* Top 5 Articles - Grid Layout Below Chart */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
                    Top 5 Articles
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(5, 1fr)',
                      },
                      gap: 2,
                    }}
                  >
                    {topArticles.slice(0, 5).map((article, idx) => (
                      <Box
                        key={article._id}
                        sx={{
                          p: 2,
                          minHeight: 160,
                          borderRadius: 2,
                          border: (t) => `1px solid ${t.palette.divider}`,
                          bgcolor: 'background.default',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            boxShadow: (t) =>
                              t.palette.mode === 'dark'
                                ? '0 8px 24px rgba(0,0,0,0.4)'
                                : '0 8px 24px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Box>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              mb: 1.5,
                            }}
                          >
                            <Typography variant="body2" fontWeight={700}>
                              {idx + 1}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: 40,
                            }}
                          >
                            {article.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
                            {article.category?.name || 'Uncategorised'}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={`${(article.viewCount || 0).toLocaleString()} views`}
                          color="primary"
                          sx={{ fontWeight: 600, alignSelf: 'flex-start' }}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                }}
              >
                <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                <Typography variant="body1" color="text.secondary" align="center" fontWeight={500}>
                  No article view data available yet.
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Views will appear here once users start reading published diabetes articles.
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* Views by Category - Full Width */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <GlassCard>
            <Box mb={2}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Views by Category
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distribution of views across diabetes topics - comprehensive breakdown
              </Typography>
            </Box>
            {viewsByCategory.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, alignItems: 'center' }}>
                <Box sx={{ flex: { xs: '1', lg: '1' }, minWidth: { lg: 400 }, maxWidth: { lg: 500 } }}>
                  <ReactApexChart
                    options={categoryViewsChartOptions}
                    series={categoryViewsChartSeries}
                    type="donut"
                    height={350}
                  />
                </Box>
                <Box sx={{ flex: { xs: '1', lg: '1' }, width: '100%' }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
                    Category Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {viewsByCategory.map((cat, idx) => {
                      const total = viewsByCategory.reduce((sum, c) => sum + c.views, 0);
                      const percentage = total > 0 ? ((cat.views / total) * 100).toFixed(1) : 0;
                      return (
                        <Box
                          key={cat.name}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: (t) => `1px solid ${t.palette.divider}`,
                            bgcolor: 'background.default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'action.hover',
                              transform: 'translateX(4px)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: categoryChartColors[idx % categoryChartColors.length],
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {cat.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {cat.views.toLocaleString()} views
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 120, height: 6, borderRadius: 3, bgcolor: 'divider', overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  bgcolor: categoryChartColors[idx % categoryChartColors.length],
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </Box>
                            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 45, textAlign: 'right' }}>
                              {percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                }}
              >
                <CategoryIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                <Typography variant="body1" color="text.secondary" align="center" fontWeight={500}>
                  No category view data available yet.
                </Typography>
                <Typography variant="caption" color="text.secondary" align="center">
                  Views will appear here once users start reading articles across different categories.
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* Charts + lists */}
      <Grid container spacing={3}>
        {/* Left: charts */}
        <Grid item xs={12} md={7}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <GlassCard>
                <Box mb={1.5}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Publishing health
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Real completion based on published vs. total
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Library published
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {totalContent
                          ? `${Math.round((publishedContent / totalContent) * 100)}%`
                          : '0%'}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        totalContent ? (publishedContent / totalContent) * 100 : 0
                      }
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Under clinical review
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {needsReview} items
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Values are taken directly from the CMS review queue – no synthetic
                      data.
                    </Typography>
                  </Box>
                </Box>
              </GlassCard>
            </Grid>
          </Grid>
        </Grid>

        {/* Right: recent & review queue */}
        <Grid item xs={12} md={5}>
          <GlassCard sx={{ mb: 2 }}>
            <Box mb={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Latest diabetes articles
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pulled from `content.stats.recentContent`
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
              {recentContent.slice(0, 6).map((item) => (
                <Box
                  key={item._id}
                  sx={{
                    p: 1.4,
                    borderRadius: 2,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.3,
                    transition: 'all 0.18s ease-out',
                    '&:hover': {
                      borderColor: 'success.main',
                      transform: 'translateY(-1px)',
                      boxShadow: (t) =>
                        t.palette.mode === 'dark'
                          ? '0 10px 30px rgba(0,0,0,0.65)'
                          : '0 10px 30px rgba(15,23,42,0.14)',
                    },
                    cursor: 'pointer',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.category?.name || 'Uncategorised'} •{' '}
                    {item.publishedAt
                      ? formatDate(item.publishedAt)
                      : 'Draft'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <ViewIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      {item.viewCount?.toLocaleString() || 0} views
                    </Typography>
                  </Box>
                </Box>
              ))}
              {recentContent.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No diabetes content has been created yet.
                </Typography>
              )}
            </Box>
          </GlassCard>

          <GlassCard>
            <Box mb={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                Review queue
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Every row below is driven by the live `reviewQueue` returned by the CMS API.
              </Typography>
            </Box>

            {reviewQueue.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Everything is clinically up to date. No diabetes content currently requires
                review.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {reviewQueue.map((item) => {
                  const dueDate = item.nextReviewDate
                    ? new Date(item.nextReviewDate)
                    : null;
                  const diffDays =
                    dueDate != null
                      ? Math.round(
                          (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                        )
                      : null;
                  const isOverdue = diffDays != null && diffDays < 0;

                  let statusLabel = 'Needs review';
                  let statusColor = isOverdue ? 'error.main' : 'warning.main';
                  if (diffDays != null) {
                    statusLabel = isOverdue
                      ? `Overdue ${Math.abs(diffDays)}d`
                      : `Due in ${diffDays}d`;
                  }

                  return (
                    <Box
                      key={item._id}
                      sx={{
                        p: 1.4,
                        borderRadius: 2,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.category?.name || 'Uncategorised'}
                          {dueDate &&
                            ` • Review ${isOverdue ? 'overdue' : 'due'} ${Math.abs(
                              diffDays || 0,
                            )}d`}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', color: statusColor, mt: 0.25 }}
                        >
                          {statusLabel}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 0.5,
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleMarkReviewed(item._id)}
                        >
                          Mark reviewed
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          {item.viewCount?.toLocaleString() || 0} views
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CMSDashboard;
