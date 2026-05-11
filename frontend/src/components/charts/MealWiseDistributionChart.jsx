import React from 'react';
import { Box } from '@mui/material';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MealWiseDistributionChart({ distributionData }) {
  return (
    <Box>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={distributionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="meal" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="calories" fill="#10b981" radius={[8, 8, 0, 0]} />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="protein" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
}
