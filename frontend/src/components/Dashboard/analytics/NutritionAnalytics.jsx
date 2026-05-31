import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../views/CarePlanView.css';

const macroFallback = [
  { label: 'Carbs', value: 65, tone: '#34d399' },
  { label: 'Protein', value: 18, tone: '#22d3ee' },
  { label: 'Fat', value: 17, tone: '#a78bfa' },
  { label: 'Fiber', value: 15, tone: '#fb923c' },
];

function average(data, key) {
  if (!data.length) return 0;
  return Math.round(data.reduce((sum, item) => sum + Number(item?.[key] || 0), 0) / data.length);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="technical-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <strong key={item.dataKey} style={{ color: item.color }}>
          {item.name || item.dataKey}: {Math.round(item.value || 0)}
        </strong>
      ))}
    </div>
  );
}

export default function NutritionAnalytics({ planUsageAnalytics, macronutrientBalance, mealWiseDistribution, onAnalyticsInteract }) {
  const series = useMemo(() => {
    const source = Array.isArray(planUsageAnalytics?.dailySeries) ? planUsageAnalytics.dailySeries : [];
    return source.slice(-7);
  }, [planUsageAnalytics?.dailySeries]);

  const macros = useMemo(() => {
    const source = macronutrientBalance || {};
    const prepared = [
      { label: 'Carbs', value: source.carbs ?? source.carbohydrates ?? macroFallback[0].value, tone: '#34d399' },
      { label: 'Protein', value: source.protein ?? macroFallback[1].value, tone: '#22d3ee' },
      { label: 'Fat', value: source.fat ?? source.fats ?? macroFallback[2].value, tone: '#a78bfa' },
      { label: 'Fiber', value: source.fiber ?? macroFallback[3].value, tone: '#fb923c' },
    ];

    return prepared.map((item) => ({
      ...item,
      value: Math.max(0, Math.min(100, Math.round(Number(item.value) || 0))),
    }));
  }, [macronutrientBalance]);

  const mealData = useMemo(() => {
    const source = Array.isArray(mealWiseDistribution) ? mealWiseDistribution : [];
    if (source.length) return source;

    return [
      { meal: 'Breakfast', calories: 380 },
      { meal: 'Lunch', calories: 520 },
      { meal: 'Dinner', calories: 470 },
      { meal: 'Snack', calories: 160 },
    ];
  }, [mealWiseDistribution]);

  return (
    <div className="nutrition-workspace" onClick={onAnalyticsInteract}>
      <div className="nutrition-column nutrition-column-primary">
        <section className="nutrition-chart-block nutrition-chart-block-tall">
          <div className="chart-heading">
            <div>
              <span>Energy Stream</span>
              <h2>Calorie Distribution</h2>
            </div>
          </div>

          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={286}>
              <AreaChart data={series} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="calorieGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.42} />
                    <stop offset="55%" stopColor="#22c55e" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <filter id="mintLineGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(226,232,240,0.34)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(226,232,240,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(45,212,191,0.24)' }} />
                <Area
                  type="monotone"
                  dataKey="dietCalories"
                  name="Calories"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#calorieGlow)"
                  filter="url(#mintLineGlow)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ecfdf5', stroke: '#34d399', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-readout">
            <span>Average intake</span>
            <strong>{average(series, 'dietCalories')} kcal/day</strong>
          </div>
        </section>

        <section className="nutrition-chart-block">
          <div className="chart-heading">
            <div>
              <span>Carb Signal</span>
              <h2>Carbohydrate Trends</h2>
            </div>
          </div>

          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={236}>
              <LineChart data={series} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <filter id="carbLineGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(226,232,240,0.34)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(226,232,240,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(251,146,60,0.24)' }} />
                <Line
                  type="monotone"
                  dataKey="dietCarbs"
                  name="Carbs"
                  stroke="#fb923c"
                  strokeWidth={2.4}
                  filter="url(#carbLineGlow)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#fff7ed', stroke: '#fb923c', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-readout">
            <span>Average load</span>
            <strong>{average(series, 'dietCarbs')} g/day</strong>
          </div>
        </section>
      </div>

      <aside className="nutrition-column nutrition-column-secondary">
        <section className="macro-console">
          <div className="chart-heading">
            <div>
              <span>Calibration Console</span>
              <h2>Macronutrient Balance</h2>
            </div>
          </div>

          <div className="macro-lines">
            {macros.map((item) => (
              <div className="macro-line" key={item.label} style={{ '--macro-tone': item.tone, '--macro-value': `${item.value}%` }}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}%</strong>
                </div>
                <i />
              </div>
            ))}
          </div>
        </section>

        <section className="nutrition-chart-block meal-console">
          <div className="chart-heading">
            <div>
              <span>Today</span>
              <h2>Meal-Wise Distribution</h2>
            </div>
          </div>

          <div className="chart-shell">
            <ResponsiveContainer width="100%" height={304}>
              <BarChart data={mealData} margin={{ top: 18, right: 10, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="mealBarGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.45} />
                  </linearGradient>
                  <filter id="barGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false} />
                <XAxis dataKey="meal" tick={{ fill: 'rgba(226,232,240,0.34)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(226,232,240,0.25)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <ReTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.06)' }} />
                <Bar dataKey="calories" name="Calories" fill="url(#mealBarGlow)" radius={[8, 8, 2, 2]} maxBarSize={26} filter="url(#barGlow)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </aside>
    </div>
  );
}
