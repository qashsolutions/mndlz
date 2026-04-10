import { useState } from 'react';
import { useData } from '../hooks/useData';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR, formatNumber } from '../utils/format';

export default function OutletArchetypes() {
  const { data, analytics, loading } = useData();
  const [selectedArchetype, setSelectedArchetype] = useState(null);

  if (loading || !data || !analytics) return <LoadingScreen />;

  const { archetypes } = analytics.archetypeResult;
  const selected = archetypes.find(a => a.id === selectedArchetype);

  return (
    <div className="view-archetypes">
      <h2 className="view-title">Outlet Archetypes</h2>
      <p className="view-desc">500 outlets clustered into 6 behavioral archetypes based on volume, SKU breadth, price-tier mix, and seasonality patterns.</p>

      <div className="archetype-grid">
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
