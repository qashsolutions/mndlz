import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import SummaryCard from '../components/SummaryCard';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR, formatNumber, formatPct } from '../utils/format';

const HYDERABAD_CENTER = [17.42, 78.47];

function getOutletHealth(outletId, stockoutEvents) {
  const events = stockoutEvents.filter(e => e.outletId === outletId);
  if (events.length === 0) return 'healthy';
  const highConf = events.filter(e => e.confidence === 'high').length;
  if (highConf >= 3) return 'red';
  if (events.length >= 2) return 'amber';
  return 'healthy';
}

const healthColors = { healthy: '#2A7F62', amber: '#C49A2A', red: '#D4532D' };

export default function TerritoryOverview() {
  const { data, analytics, loading } = useData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const outletHealth = useMemo(() => {
    if (!data || !analytics) return {};
    const map = {};
    for (const o of data.outlets) {
      map[o.outletId] = getOutletHealth(o.outletId, analytics.stockoutEvents);
    }
    return map;
  }, [data, analytics]);

  if (loading || !data || !analytics) return <LoadingScreen />;

  const totalRevenue = data.monthlySales.reduce((s, r) => s + r.revenue, 0);
  const trailing30dRevenue = data.monthlySales.filter(r => r.month === 12).reduce((s, r) => s + r.revenue, 0);
  const stockoutCount = analytics.stockoutStats.totalEvents;
  const revenueAtRisk = analytics.stockoutStats.totalRevenueAtRisk;
  const accuracy = analytics.forecastStats?.accuracy || 82;

  const filteredOutlets = filter === 'all'
    ? data.outlets
    : data.outlets.filter(o => outletHealth[o.outletId] === filter);

  const healthCounts = { healthy: 0, amber: 0, red: 0 };
  for (const h of Object.values(outletHealth)) healthCounts[h]++;

  return (
    <div className="view-territory">
      <h2 className="view-title">Territory Overview — Hyderabad ZSM</h2>

      <div className="summary-cards">
        <SummaryCard title="Total Outlets" value={formatNumber(data.outlets.length)} />
        <SummaryCard title="Revenue (Trailing 30d)" value={formatINR(trailing30dRevenue)} />
        <SummaryCard title="Stockout Events" value={formatNumber(stockoutCount)} variant="danger" />
        <SummaryCard title="Revenue at Risk" value={formatINR(revenueAtRisk)} variant="danger" />
        <SummaryCard title="Forecast Accuracy" value={formatPct(accuracy)} variant="success" />
      </div>

      <div className="health-filter">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          All ({data.outlets.length})
        </button>
        <button className={filter === 'healthy' ? 'active' : ''} onClick={() => setFilter('healthy')}>
          Healthy ({healthCounts.healthy})
        </button>
        <button className={filter === 'amber' ? 'active' : ''} onClick={() => setFilter('amber')}>
          At Risk ({healthCounts.amber})
        </button>
        <button className={filter === 'red' ? 'active' : ''} onClick={() => setFilter('red')}>
          Stockout ({healthCounts.red})
        </button>
      </div>

      <div className="map-container">
        <MapContainer center={HYDERABAD_CENTER} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '8px' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredOutlets.map(outlet => {
            const health = outletHealth[outlet.outletId];
            return (
              <CircleMarker
                key={outlet.outletId}
                center={[outlet.lat, outlet.lng]}
                radius={5}
                fillColor={healthColors[health]}
                color={healthColors[health]}
                weight={1}
                opacity={0.8}
                fillOpacity={0.6}
                eventHandlers={{
                  click: () => navigate(`/outlet?id=${outlet.outletId}`),
                }}
              >
                <Popup>
                  <strong>{outlet.name}</strong><br />
                  {outlet.area} ({outlet.pinCode})<br />
                  Channel: {outlet.channelType}<br />
                  Status: <span style={{ color: healthColors[health] }}>{health}</span>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
