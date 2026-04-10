import { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useData } from '../hooks/useData';
import SummaryCard from '../components/SummaryCard';
import LoadingScreen from '../components/LoadingScreen';
import { formatINR } from '../utils/format';

export default function StockoutHeatmap() {
  const { data, analytics, loading } = useData();
  const svgRef = useRef();
  const [timeRange, setTimeRange] = useState('all'); // 'last4', 'last12', 'all'
  const [channelFilter, setChannelFilter] = useState('all');
  const [archetypeFilter, setArchetypeFilter] = useState('all');

  const heatmapData = useMemo(() => {
    if (!data || !analytics) return null;

    // Filter events by time range
    let events = analytics.stockoutEvents;
    if (timeRange === 'last4') events = events.filter(e => e.month >= 9);
    else if (timeRange === 'last12') events = events.filter(e => e.month >= 1);

    // Filter by channel
    if (channelFilter !== 'all') {
      const outletIds = new Set(data.outlets.filter(o => o.channelType === channelFilter).map(o => o.outletId));
      events = events.filter(e => outletIds.has(e.outletId));
    }

    // Filter by archetype
    if (archetypeFilter !== 'all') {
      const arch = analytics.archetypeResult.archetypes.find(a => a.id === archetypeFilter);
      if (arch) {
        const outletIds = new Set(arch.outletIds);
        events = events.filter(e => outletIds.has(e.outletId));
      }
    }

    // Build outlet-to-beat map
    const outletBeat = {};
    for (const o of data.outlets) outletBeat[o.outletId] = o.beatId;

    // Matrix: SKU (rows) x Beat (columns) -> stockout count
    const matrix = {};
    const beatIds = [...new Set(data.beats.map(b => b.beatId))].sort((a, b) => a - b);

    for (const sku of data.skus) {
      matrix[sku.skuId] = {};
      for (const beat of beatIds) matrix[sku.skuId][beat] = 0;
    }

    for (const e of events) {
      const beat = outletBeat[e.outletId];
      if (beat && matrix[e.skuId]) matrix[e.skuId][beat]++;
    }

    return { matrix, beatIds, events };
  }, [data, analytics, timeRange, channelFilter, archetypeFilter]);

  // D3 heatmap rendering
  useEffect(() => {
    if (!heatmapData || !svgRef.current) return;

    const { matrix, beatIds } = heatmapData;
    const skuIds = data.skus.map(s => s.skuId);
    const skuNames = data.skus.map(s => s.name.replace('Cadbury ', ''));

    const margin = { top: 30, right: 20, bottom: 60, left: 160 };
    const cellW = Math.max(16, Math.min(28, (window.innerWidth - 300 - margin.left - margin.right) / beatIds.length));
    const cellH = 22;
    const width = margin.left + cellW * beatIds.length + margin.right;
    const height = margin.top + cellH * skuIds.length + margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Get max value for color scale
    let maxVal = 0;
    for (const skuId of skuIds) {
      for (const beat of beatIds) {
        maxVal = Math.max(maxVal, matrix[skuId]?.[beat] || 0);
      }
    }

    const colorScale = d3.scaleSequential()
      .domain([0, Math.max(maxVal, 1)])
      .interpolator(d3.interpolateRgbBasis(['#F7F5F0', '#C49A2A', '#D4532D']));

    // Draw cells
    for (let si = 0; si < skuIds.length; si++) {
      for (let bi = 0; bi < beatIds.length; bi++) {
        const val = matrix[skuIds[si]]?.[beatIds[bi]] || 0;
        g.append('rect')
          .attr('x', bi * cellW)
          .attr('y', si * cellH)
          .attr('width', cellW - 1)
          .attr('height', cellH - 1)
          .attr('fill', colorScale(val))
          .attr('rx', 2)
          .append('title')
          .text(`${skuNames[si]} / Beat ${String(beatIds[bi]).padStart(2, '0')}: ${val} stockout events`);
      }
    }

    // Y axis — SKU names
    g.selectAll('.sku-label')
      .data(skuNames)
      .enter()
      .append('text')
      .attr('x', -6)
      .attr('y', (d, i) => i * cellH + cellH / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', '#1B2A4A')
      .text(d => d);

    // X axis — Beat IDs
    g.selectAll('.beat-label')
      .data(beatIds)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * cellW + cellW / 2)
      .attr('y', skuIds.length * cellH + 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#1B2A4A')
      .text(d => `B${d}`);

  }, [heatmapData, data]);

  // Revenue-at-risk rollup from filtered events (not the unfiltered global stats)
  const filteredSkuRisk = useMemo(() => {
    if (!heatmapData) return [];
    const bySku = {};
    for (const e of heatmapData.events) {
      if (!bySku[e.skuId]) bySku[e.skuId] = { skuId: e.skuId, skuName: e.skuName, events: 0, revenueAtRisk: 0 };
      bySku[e.skuId].events++;
      bySku[e.skuId].revenueAtRisk += e.revenueAtRisk;
    }
    return Object.values(bySku).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);
  }, [heatmapData]);

  if (loading || !data || !analytics) return <LoadingScreen />;

  // Top insight
  const topSku = analytics.stockoutStats.bySku[0];
  const topSkuPct = topSku
    ? Math.round((topSku.events / analytics.stockoutStats.totalEvents) * 100)
    : 0;

  return (
    <div className="view-stockouts">
      <h2 className="view-title">Stockout Heatmap</h2>

      <div className="insight-callout">
        <strong>Key Insight:</strong> {topSku?.skuName} has the highest stockout rate ({topSkuPct}% of events)
        {' '} — {formatINR(topSku?.revenueAtRisk || 0)} at risk.
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>Time Range</label>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
            <option value="last4">Last 4 Months</option>
            <option value="last12">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Channel</label>
          <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
            <option value="all">All Channels</option>
            <option value="grocery">Grocery</option>
            <option value="paan-plus">Paan Plus</option>
            <option value="general">General</option>
            <option value="cosmetic">Cosmetic</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Archetype</label>
          <select value={archetypeFilter} onChange={e => setArchetypeFilter(e.target.value)}>
            <option value="all">All Archetypes</option>
            {analytics.archetypeResult.archetypes.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.outletCount})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="heatmap-scroll">
        <svg ref={svgRef} />
      </div>

      <h3 className="section-title">Revenue at Risk by SKU</h3>
      <div className="sku-risk-table">
        <table>
          <thead>
            <tr><th>SKU</th><th>Events</th><th>Revenue at Risk</th></tr>
          </thead>
          <tbody>
            {filteredSkuRisk.slice(0, 10).map(s => (
              <tr key={s.skuId}>
                <td>{s.skuName}</td>
                <td>{s.events}</td>
                <td className="text-danger">{formatINR(s.revenueAtRisk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
