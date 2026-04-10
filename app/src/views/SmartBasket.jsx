import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '../hooks/useData';
import { outletBasketComparison } from '../analytics/smartBasket';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR } from '../utils/format';

const statusColors = { missing: '#D4532D', under: '#C49A2A', over: '#8B5CF6', on_track: '#2A7F62' };
const statusLabels = { missing: 'Add This SKU', under: 'Under-ordering', over: 'Over-ordering', on_track: 'On Track' };

export default function SmartBasket() {
  const { data, analytics, loading } = useData();
  const [search, setSearch] = useState('');
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  const filteredOutlets = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.outlets.filter(o =>
      o.name.toLowerCase().includes(q) || o.outletId.toLowerCase().includes(q) || o.area.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [data, search]);

  const comparison = useMemo(() => {
    if (!selectedOutlet || !data || !analytics) return null;
    return outletBasketComparison(
      selectedOutlet,
      analytics.archetypeResult,
      analytics.idealBaskets,
      data.monthlySales,
      data.skus
    );
  }, [selectedOutlet, data, analytics]);

  if (loading || !data || !analytics) return <LoadingScreen />;

  const chartData = comparison?.comparison.map(c => ({
    name: c.skuName.replace('Cadbury ', '').substring(0, 18),
    Current: c.currentWeekly,
    Ideal: c.idealWeekly,
    status: c.status,
  })) || [];

  return (
    <div className="view-basket">
      <h2 className="view-title">Smart Basket</h2>
      <p className="view-desc">AI-recommended SKU basket per outlet, compared against current ordering pattern.</p>

      <div className="outlet-search">
        <input
          type="text"
          placeholder="Search outlet by name, ID, or area..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <ul className="search-results">
            {filteredOutlets.map(o => (
              <li
                key={o.outletId}
                className={selectedOutlet === o.outletId ? 'selected' : ''}
                onClick={() => { setSelectedOutlet(o.outletId); setSearch(''); }}
              >
                <strong>{o.name}</strong> — {o.area} ({o.channelType})
              </li>
            ))}
          </ul>
        )}
      </div>

      {comparison && (
        <>
          <div className="basket-header">
            <h3>{data.outlets.find(o => o.outletId === selectedOutlet)?.name}</h3>
            <span className="archetype-tag" style={{ backgroundColor: analytics.archetypeResult.archetypes.find(a => a.id === comparison.archetypeId)?.color || '#666' }}>
              {comparison.archetypeName}
            </span>
            <div className="uplift-badge">
              Estimated Monthly Uplift: <strong>{formatINR(comparison.totalMonthlyUplift)}</strong>
            </div>
          </div>

          <div className="basket-chart">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Current" fill="#9CA3AF" barSize={12} />
                <Bar dataKey="Ideal" barSize={12}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={statusColors[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="basket-table">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Current (wk)</th>
                  <th>Ideal (wk)</th>
                  <th>Gap</th>
                  <th>Status</th>
                  <th>Monthly Uplift</th>
                </tr>
              </thead>
              <tbody>
                {comparison.comparison.map(c => (
                  <tr key={c.skuId} className={`status-${c.status}`}>
                    <td>{c.skuName}</td>
                    <td>{c.currentWeekly}</td>
                    <td>{c.idealWeekly}</td>
                    <td style={{ color: c.gap > 0 ? '#D4532D' : c.gap < 0 ? '#8B5CF6' : '#2A7F62' }}>
                      {c.gap > 0 ? '+' : ''}{c.gap}
                    </td>
                    <td>
                      <span className="status-pill" style={{ backgroundColor: statusColors[c.status] }}>
                        {statusLabels[c.status]}
                      </span>
                    </td>
                    <td>{c.monthlyUpliftValue > 0 ? formatINR(c.monthlyUpliftValue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!comparison && !search && (
        <div className="empty-state">
          <p>Search for an outlet above to see its smart basket recommendation.</p>
        </div>
      )}
    </div>
  );
}
