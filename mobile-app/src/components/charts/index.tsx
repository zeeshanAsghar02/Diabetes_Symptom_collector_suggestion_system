/**
 * Charts & Visualization Components
 * Exports chart components used for data visualization.
 */

import React from 'react';
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
} from 'victory-native';
import { useTheme } from 'react-native-paper';

type XYDatum = { x: string | number; y: number };

type HealthPieChartProps = {
  data: Array<{ x?: string | number; y: number; label?: string }>;
};

export const HealthPieChart: React.FC<HealthPieChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <VictoryPie
      data={data}
      colorScale={['tomato', 'orange', 'gold', 'cyan', 'navy']}
      style={{
        labels: { fill: theme.colors.onBackground, fontSize: 16, fontWeight: 'bold' },
      }}
    />
  );
};

type HealthLineChartProps = {
  data: XYDatum[];
};

export const HealthLineChart: React.FC<HealthLineChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <VictoryChart theme={VictoryTheme.material}>
      <VictoryLine
        style={{
          data: { stroke: theme.colors.primary },
        }}
        data={data}
      />
    </VictoryChart>
  );
};

type HealthBarChartProps = {
  data: XYDatum[];
};

export const HealthBarChart: React.FC<HealthBarChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <VictoryChart domainPadding={20} theme={VictoryTheme.material}>
      <VictoryAxis tickValues={data.map((d) => d.x)} />
      <VictoryAxis dependentAxis tickFormat={(x) => `${Number(x) / 1000}k`} />
      <VictoryBar
        data={data}
        x="x"
        y="y"
        style={{ data: { fill: theme.colors.primary } }}
      />
    </VictoryChart>
  );
};
