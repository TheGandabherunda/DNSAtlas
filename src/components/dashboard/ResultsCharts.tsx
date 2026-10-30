import React, { useState } from 'react';
import { ProviderBenchmarkSummary } from '../../types/dns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart } from 'lucide-react';

interface ResultsChartsProps {
  summaries: ProviderBenchmarkSummary[];
}

export const ResultsCharts: React.FC<ResultsChartsProps> = ({ summaries }) => {
  const [activeChart, setActiveChart] = useState<'latency' | 'timeline' | 'reliability'>('latency');

  // Prepare latency bar chart data
  const latencyData = summaries
    .filter((s) => s.successfulQueries > 0)
    .map((s) => ({
      name: s.providerName.length > 18 ? `${s.providerName.substring(0, 16)}…` : s.providerName,
      fullName: s.providerName,
      average: s.overallAverageLatencyMs,
      median: s.medianLatencyMs,
      p90: s.p90LatencyMs,
      min: s.minLatencyMs,
    }));

  // Prepare timeline data across queries
  const maxQueries = Math.max(...summaries.map((s) => s.measurements.length), 0);
  const timelineData: Array<Record<string, number | string>> = [];

  for (let q = 0; q < maxQueries; q++) {
    const point: Record<string, number | string> = {
      query: `Q${q + 1}`,
    };
    for (const summary of summaries) {
      const m = summary.measurements[q];
      if (m && m.success) {
        point[summary.providerName] = m.latencyMs;
      }
    }
    timelineData.push(point);
  }

  // Reliability data
  const reliabilityData = summaries.map((s) => ({
    name: s.providerName.length > 18 ? `${s.providerName.substring(0, 16)}…` : s.providerName,
    fullName: s.providerName,
    successful: s.successfulQueries,
    failed: s.failedQueries,
    timeouts: s.timeoutCount,
  }));

  const lineColors = [
    '#38bdf8',
    '#34d399',
    '#fbbf24',
    '#f87171',
    '#a78bfa',
    '#f472b6',
    '#fb923c',
    '#4ade80',
    '#60a5fa',
    '#e879f9',
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground">Performance Visualizations</h3>
          <p className="text-xs text-muted-foreground">
            Objective latency distribution and query sequence comparisons.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setActiveChart('latency')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeChart === 'latency'
                ? 'bg-card text-cyan-500 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Latency</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('timeline')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeChart === 'timeline'
                ? 'bg-card text-cyan-500 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChart('reliability')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeChart === 'reliability'
                ? 'bg-card text-cyan-500 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Reliability</span>
          </button>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
        {activeChart === 'latency' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                unit="ms"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="average" name="Average Latency (ms)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="median" name="Median Latency (ms)" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="p90" name="P90 Latency (ms)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis dataKey="query" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              {summaries.map((s, idx) => (
                <Line
                  key={s.providerId}
                  type="monotone"
                  dataKey={s.providerName}
                  stroke={lineColors[idx % lineColors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'reliability' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reliabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="successful" name="Successful Queries" fill="#34d399" stackId="a" />
              <Bar dataKey="failed" name="Failed Queries" fill="#f87171" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
