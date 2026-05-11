import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { alpha } from '@mui/material/styles';

export default function MetricChart({ 
  title, 
  dataKey, 
  color, 
  unit, 
  data, 
  description, 
  emptyMessage,
  onPointClick 
}) {
  const hasData = data && data.some((d) => d[dataKey] != null && d[dataKey] !== 0);

  const calculateTrend = (current, previous) => {
    if (current == null || previous == null) return null;
    const diff = current - previous;
    return { diff, current, previous };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    const value = payload[0].value;
    const dataIndex = data.findIndex(d => d.label === label);
    const trend = dataIndex > 0 ? calculateTrend(value, data[dataIndex - 1]?.[dataKey]) : null;

    return (
      <Paper sx={{ p: 1.5, border: 1, borderColor: 'divider' }} elevation={3}>
        <Typography variant="caption" display="block" fontWeight={600}>
          {label}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
          <Typography variant="body2" fontWeight={700}>
            {value} {unit}
          </Typography>
          {trend && trend.diff !== 0 && (
            <Chip 
              size="small" 
              label={`${trend.diff > 0 ? '+' : ''}${Math.round(trend.diff)}`}
              color={trend.diff > 0 ? 'success' : 'error'}
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {trend && trend.previous && (
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Previous: {Math.round(trend.previous)} {unit}
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
        {title}
      </Typography>
      {hasData ? (
        <>
          <Box sx={{ mt: 1, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ReTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, cursor: 'pointer' }}
                  activeDot={{ 
                    r: 7, 
                    cursor: 'pointer',
                    onClick: (e, payload) => onPointClick && onPointClick(payload.payload)
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
          {description && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, display: 'block' }}
            >
              {description}
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {emptyMessage || 'No data available'}
        </Typography>
      )}
    </Box>
  );
}
