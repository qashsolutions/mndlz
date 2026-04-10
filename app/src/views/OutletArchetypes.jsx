import { useState, useMemo, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '../hooks/useData';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR, formatNumber } from '../utils/format';

const ARCHETYPE_COLORS = {
  premium_urban: '#2A7F62',
  value_suburban: '#C49A2A',
  impulse_transit: '#D4532D',
  steady_staples: '#1B2A4A',
  festival_spiker: '#8B5CF6',
  underperforming: '#9CA3AF',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.[0]?.payload) return null;
  const d = payload[0].payload;
  return (
    <div className="scatter-tooltip">
      <strong>{d.name}</strong>
      <div>{d.archetypeName}</div>
      <div>Revenue: {formatINR(d.revenue)}/mo</div>
      <div>SKU Breadth: {d.breadth} of 20</div>
      <div>{d.area} ({d.pinCode})</div>
    </div>
  );
}

export default function OutletArchetypes() {
  const { data, analytics, loading } = useData();
  const [selectedArchetype, setSelectedArchetype] = useState(null);
  const cardsRef = useRef(null);

  const scatterData = useMemo(() => {
    if (!data || !analytics) return [];
    const { assignments, archetypes } = analytics.archetypeResult;
    const archMap = Object.fromEntries(archetypes.map(a => [a.id, a]));
    const outletMap = Object.fromEntries(data.outlets.map(o => [o.outletId, o]));

    return assignments.map(a => {
      const outlet = outletMap[a.outletId];
      const arch = archMap[a.archetypeId];
      return {
        outletId: a.outletId,
        name: outlet?.name || a.outletId,
        area: outlet?.area || '',
        pinCode: outlet?.pinCode || '',
        archetypeId: a.archetypeId,
        archetypeName: arch?.name || a.archetypeId,
        color: ARCHETYPE_COLORS[a.archetypeId] || '#999',
        revenue: Math.round(a.features.totalRevenue / 12),
        breadth: a.features.skuBreadth,
      };
    });
  }, [data, analytics]);

  if (loading || !data || !analytics) return <LoadingScreen />;

  const { archetypes } = analytics.archetypeResult;
  const selected = archetypes.find(a => a.id === selectedArchetype);

  // Group scatter data by archetype for separate Scatter series (needed for legend)
  const seriesByArchetype = archetypes.map(arch => ({
    id: arch.id,
    name: `${arch.name} (${arch.outletCount})`,
    color: ARCHETYPE_COLORS[arch.id] || '#999',
    data: scatterData.filter(d => d.archetypeId === arch.id),
  }));

  function handleDotClick(entry) {
    setSelectedArchetype(entry.archetypeId);
    cardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="view-archetypes">
      <h2 className="view-title">Outlet Archetypes</h2>
      <p className="view-desc">500 outlets clustered into 6 behavioral archetypes based on volume, SKU breadth, price-tier mix, and seasonality patterns.</p>

      <div className="scatter-container">
        <h3 className="section-title">Cluster Map — Revenue vs. SKU Breadth</h3>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
            <XAxis
              type="number"
              dataKey="revenue"
              name="Monthly Revenue"
              tickFormatter={v => formatINR(v)}
              label={{ value: 'Monthly Revenue (₹)', position: 'bottom', offset: 20, style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <YAxis
              type="number"
              dataKey="breadth"
              name="SKU Breadth"
              domain={[0, 22]}
              label={{ value: 'SKU Breadth (of 20)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: '#6B7280' } }}
            />
            <ZAxis range={[30, 30]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 8, fontSize: 11 }}
            />
            {seriesByArchetype.map(series => (
              <Scatter
                key={series.id}
                name={series.name}
                data={series.data}
                fill={series.color}
                fillOpacity={0.7}
                onClick={handleDotClick}
                cursor="pointer"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div ref={cardsRef} className="archetype-grid">
        {archetypes.map(arch => (
          <div
            key={arch.id}
            className={`archetype-card ${selectedArchetype === arch.id ? 'selected' : ''}`}
            onClick={() => setSelectedArchetype(selectedArchetype === arch.id ? null : arch.id)}
            style={{ borderLeftColor: arch.color }}
          >
            <h3 style={{ color: arch.color }}>{arch.name}</h3>
            <p className="archetype-desc">{arch.description}</p>
            <div className="archetype-stats">
              <div>
                <span className="stat-value">{arch.outletCount}</span>
                <span className="stat-label">Outlets</span>
              </div>
              <div>
                <span className="stat-value">{formatINR(arch.avgAnnualRevenue)}</span>
                <span className="stat-label">Avg Annual Rev</span>
              </div>
              <div>
                <span className="stat-value">{arch.avgSkuBreadth}</span>
                <span className="stat-label">Avg SKUs</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="archetype-detail">
          <h3 style={{ color: selected.color }}>{selected.name} — {selected.outletCount} Outlets</h3>

          <h4>Ideal Basket</h4>
          <div className="ideal-basket-table">
            <table>
              <thead>
                <tr><th>SKU</th><th>Brand</th><th>Weekly Ideal (units)</th><th>Monthly Ideal (units)</th></tr>
              </thead>
              <tbody>
                {(analytics.idealBaskets[selected.id] || []).slice(0, 15).map(item => (
                  <tr key={item.skuId}>
                    <td>{item.skuName}</td>
                    <td>{item.brand}</td>
                    <td>{item.weeklyIdeal}</td>
                    <td>{item.monthlyIdeal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4>Outlets in this Archetype</h4>
          <div className="outlet-list-scroll">
            <table>
              <thead>
                <tr><th>Outlet</th><th>Area</th><th>Channel</th></tr>
              </thead>
              <tbody>
                {selected.outletIds.slice(0, 30).map(outletId => {
                  const o = data.outlets.find(x => x.outletId === outletId);
                  return o ? (
                    <tr key={o.outletId}>
                      <td>{o.name}</td>
                      <td>{o.area}</td>
                      <td>{o.channelType}</td>
                    </tr>
                  ) : null;
                })}
              </tbody>
            </table>
            {selected.outletIds.length > 30 && (
              <p className="more-text">...and {selected.outletIds.length - 30} more outlets</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
