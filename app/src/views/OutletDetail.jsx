import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useData } from '../hooks/useData';
import { outletBasketComparison } from '../analytics/smartBasket';
import { generateForecasts } from '../analytics/demandForecast';
import LoadingScreen from '../components/LoadingScreen';
import SummaryCard from '../components/SummaryCard';
import { formatINR } from '../utils/format';

export default function OutletDetail() {
  const { data, analytics, loading } = useData();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get('id') || null);
  const [selectedSku, setSelectedSku] = useState(null);

  const outlet = useMemo(
    () => data?.outlets.find(o => o.outletId === selectedOutlet),
    [data, selectedOutlet]
  );

  const archetype = useMemo(() => {
    if (!analytics || !selectedOutlet) return null;
    const assignment = analytics.archetypeResult.assignments.find(a => a.outletId === selectedOutlet);
    if (!assignment) return null;
    return analytics.archetypeResult.archetypes.find(a => a.id === assignment.archetypeId);
  }, [analytics, selectedOutlet]);

  const weeklyChartData = useMemo(() => {
    if (!data || !selectedOutlet || !selectedSku) return [];
    const rows = data.weeklySales
      .filter(r => r.outletId === selectedOutlet && r.skuId === selectedSku)
      .sort((a, b) => a.week - b.week);

    // Generate backtest forecasts
    const forecasts = {};
    if (rows.length > 8) {
      const allWeekly = data.weeklySales.filter(r => r.outletId === selectedOutlet && r.skuId === selectedSku);
      const fc = generateForecasts(allWeekly, data.schemes);
      for (const f of fc) forecasts[f.week] = f.predicted;
    }

    return rows.map(r => ({
      week: `W${r.week}`,
      actual: r.units,
      forecast: forecasts[r.week] ?? null,
      isStockout: r.isStockout,
    }));
  }, [data, selectedOutlet, selectedSku]);

  const comparison = useMemo(() => {
    if (!selectedOutlet || !data || !analytics) return null;
    return outletBasketComparison(
      selectedOutlet, analytics.archetypeResult, analytics.idealBaskets, data.monthlySales, data.skus
    );
  }, [selectedOutlet, data, analytics]);

  const filteredOutlets = useMemo(() => {
    if (!data || !search) return [];
    const q = search.toLowerCase();
    return data.outlets.filter(o =>
      o.name.toLowerCase().includes(q) || o.outletId.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [data, search]);

  if (loading || !data || !analytics) return <LoadingScreen />;

  // Check if this outlet has weekly detail data
  const hasWeeklyData = data.weeklySales.some(r => r.outletId === selectedOutlet);
  const outletSkus = hasWeeklyData
    ? [...new Set(data.weeklySales.filter(r => r.outletId === selectedOutlet).map(r => r.skuId))]
    : [];

  return (
    <div className="view-outlet-detail">
      <h2 className="view-title">Outlet Detail</h2>

      {!selectedOutlet && (
        <div className="outlet-search">
          <input
            type="text"
            placeholder="Search outlet by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <ul className="search-results">
              {filteredOutlets.map(o => (
                <li key={o.outletId} onClick={() => { setSelectedOutlet(o.outletId); setSearch(''); }}>
                  <strong>{o.name}</strong> — {o.area} ({o.channelType})
                </li>
              ))}
            </ul>
          )}
          <div className="empty-state">
            <p>Search for an outlet to view its detailed profile, weekly sales trend, and basket recommendation.</p>
            <p className="empty-state__hint">Try these examples (OUT0001–OUT0050 have weekly drill-down charts):</p>
            <div className="quick-picks">
              <button onClick={() => { setSelectedOutlet('OUT0001'); setSearch(''); }}>OUT0001</button>
              <button onClick={() => { setSelectedOutlet('OUT0010'); setSearch(''); }}>OUT0010</button>
              <button onClick={() => { setSelectedOutlet('OUT0025'); setSearch(''); }}>OUT0025</button>
              <button onClick={() => setSearch('Sharma')}>Sharma</button>
              <button onClick={() => setSearch('Reddy')}>Reddy</button>
              <button onClick={() => setSearch('Ameerpet')}>Ameerpet</button>
            </div>
          </div>
        </div>
      )}

      {outlet && (
        <>
          <div className="outlet-profile">
            <div className="profile-header">
              <h3>{outlet.name}</h3>
              <button className="btn-secondary" onClick={() => { setSelectedOutlet(null); setSelectedSku(null); }}>
                Change Outlet
              </button>
            </div>
            <div className="summary-cards">
              <SummaryCard title="Area" value={outlet.area} subtitle={`PIN: ${outlet.pinCode}`} />
              <SummaryCard title="Channel" value={outlet.channelType} />
              <SummaryCard title="Beat" value={`Beat ${String(outlet.beatId).padStart(2, '0')}`} />
              {archetype && (
                <SummaryCard title="Archetype" value={archetype.name} variant="success" />
              )}
            </div>
          </div>

          {hasWeeklyData && (
            <div className="sku-selector">
              <h4>Weekly Sales Trend</h4>
              <select value={selectedSku || ''} onChange={e => setSelectedSku(e.target.value || null)}>
                <option value="">Select a SKU...</option>
                {outletSkus.map(skuId => {
                  const sku = data.skus.find(s => s.skuId === skuId);
                  return <option key={skuId} value={skuId}>{sku?.name || skuId}</option>;
                })}
              </select>
            </div>
          )}

          {weeklyChartData.length > 0 && (
            <div className="weekly-chart">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyChartData} margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#1B2A4A" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="forecast" stroke="#2A7F62" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  {weeklyChartData.filter(d => d.isStockout).map((d, i) => (
                    <ReferenceDot key={i} x={d.week} y={0} r={4} fill="#D4532D" stroke="#D4532D" />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <p className="chart-legend-note">Red dots indicate probable stockout events</p>
            </div>
          )}

          {!hasWeeklyData && (
            <div className="info-box">
              <p>Weekly drill-down data is available for the first 50 outlets. This outlet has monthly data only.</p>
            </div>
          )}

          {comparison && (
            <div className="inline-basket">
              <h4>Basket Recommendation</h4>
              <p>Estimated monthly uplift: <strong>{formatINR(comparison.totalMonthlyUplift)}</strong></p>
              <table>
                <thead>
                  <tr><th>SKU</th><th>Current/wk</th><th>Ideal/wk</th><th>Gap</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {comparison.comparison.slice(0, 10).map(c => (
                    <tr key={c.skuId}>
                      <td>{c.skuName}</td>
                      <td>{c.currentWeekly}</td>
                      <td>{c.idealWeekly}</td>
                      <td style={{ color: c.gap > 0 ? '#D4532D' : '#2A7F62' }}>{c.gap > 0 ? '+' : ''}{c.gap}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
