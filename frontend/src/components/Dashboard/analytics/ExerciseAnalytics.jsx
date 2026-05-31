import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../views/CarePlanView.css';

const ranges = [
  { key: 'daily', label: '7D', size: 7 },
  { key: 'weekly', label: '14D', size: 14 },
  { key: 'monthly', label: '30D', size: 30 },
];

function average(data) {
  if (!data.length) return 0;
  return Math.round(data.reduce((sum, item) => sum + Number(item?.exerciseMinutes || 0), 0) / data.length);
}

function TooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="technical-tooltip">
      <span>{label}</span>
      <strong style={{ color: '#22d3ee' }}>Minutes: {Math.round(payload[0]?.value || 0)}</strong>
    </div>
  );
}

export default function ExerciseAnalytics({ planUsageAnalytics, onAnalyticsInteract }) {
  const [exerciseTimeRange, setExerciseTimeRange] = useState('weekly');

  const series = useMemo(() => {
    const source = Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries : [];
    const size = ranges.find((item) => item.key === exerciseTimeRange)?.size || 14;
    return source.slice(-size);
  }, [exerciseTimeRange, planUsageAnalytics?.dailySeries]);

  return (
    <section className="exercise-workspace" onClick={onAnalyticsInteract}>
      <div className="chart-heading">
        <div>
          <span>Movement Stream</span>
          <h2>Exercise Duration</h2>
        </div>

        <div className="range-switch">
          {ranges.map((item) => (
            <button
              key={item.key}
              type="button"
              className={exerciseTimeRange === item.key ? 'is-active' : ''}
              onClick={() => setExerciseTimeRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={series} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="exerciseGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                <stop offset="58%" stopColor="#38bdf8" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <filter id="exerciseLineGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'rgba(226,232,240,0.34)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(226,232,240,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <ReTooltip content={<TooltipContent />} cursor={{ stroke: 'rgba(34,211,238,0.24)' }} />
            <Area
              type="monotone"
              dataKey="exerciseMinutes"
              name="Minutes"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#exerciseGlow)"
              filter="url(#exerciseLineGlow)"
              dot={false}
              activeDot={{ r: 4, fill: '#ecfeff', stroke: '#22d3ee', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-readout">
        <span>Average movement</span>
        <strong>{average(series)} min/day</strong>
      </div>
    </section>
  );
}
