import { useData } from '../hooks/useData';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SummaryCard from '../components/SummaryCard';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR, formatPct } from '../utils/format';

export default function PilotSimulation() {
  const { data, analytics, loading } = useData();

  if (loading || !data || !analytics) return <LoadingScreen />;

  const { liftResult } = analytics;
  const { summary, weeklyData, recommendation, testOutletCount, controlOutletCount } = liftResult;

  const chartData = weeklyData.map(w => ({
    week: `W${w.week}`,
    'Test Group': w.testCumulative,
    'Control Group': w.controlCumulative,
  }));

  return (
    <div className="view-simulation">
      <h2 className="view-title">Pilot Simulation — Lift vs. Control</h2>
      <p className="view-desc">
        Simulated 90-day pilot: {testOutletCount} test outlets (smart basket applied) vs. {controlOutletCount} control outlets (status quo). Matched by archetype distribution.
      </p>

      <div className="summary-cards">
        <SummaryCard title="Test Group Revenue" value={formatINR(summary.totalTestRevenue)} variant="success" />
        <SummaryCard title="Control Group Revenue" value={formatINR(summary.totalControlRevenue)} />
        <SummaryCard title="Incremental Revenue" value={formatINR(summary.incrementalRevenue)} variant="success"
          subtitle={`${summary.incrementalRevenueLakhs} Lakhs`} />
        <SummaryCard title="Lift" value={formatPct(summary.liftPercent)} variant="success" />
      </div>

      <div className="simulation-chart">
        <h3>Cumulative Secondary Sales — 90 Days</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <XAxis dataKey="week" />
            <YAxis tickFormatter={v => formatINR(v)} />
            <Tooltip formatter={v => formatINR(v)} />
            <Legend />
            <Line type="monotone" dataKey="Test Group" stroke="#2A7F62" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Control Group" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`recommendation-box recommendation--${recommendation.decision.toLowerCase()}`}>
        <h3>Recommendation: {recommendation.decision}</h3>
        {Array.isArray(recommendation.rationale) ? (
          <ul>
            {recommendation.rationale.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        ) : (
          <p>{recommendation.rationale}</p>
        )}
      </div>
    </div>
  );
}
