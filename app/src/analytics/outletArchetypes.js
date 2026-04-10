/**
 * Outlet Archetypes Module
 * Clusters 500 outlets into 5-6 intuitive archetypes.
 * // HOOK: Replace with real clustering model (k-means, DBSCAN)
 */

const ARCHETYPE_DEFS = [
  { id: 'premium_urban', name: 'Premium Urban', description: 'High volume, Silk/Bournville heavy, urban premium locations', color: '#2A7F62' },
  { id: 'value_suburban', name: 'Value Suburban', description: 'High volume, small packs dominant, price-sensitive shoppers', color: '#C49A2A' },
  { id: 'impulse_transit', name: 'Impulse Transit', description: 'Paan-plus & transit, small packs, high frequency low value', color: '#D4532D' },
  { id: 'steady_staples', name: 'Steady Staples', description: 'Bournvita/Tang dominant, low chocolate share, steady demand', color: '#1B2A4A' },
  { id: 'festival_spiker', name: 'Festival Spiker', description: 'Low base but huge Diwali/Valentine\'s peaks, gifting-driven', color: '#8B5CF6' },
  { id: 'underperforming', name: 'Underperforming', description: 'Low volume across the board, likely under-distribution', color: '#9CA3AF' },
];

/**
 * Assign each outlet to an archetype based on computed features.
 */
export function assignArchetypes(outlets, monthlySales, skus) {
  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));

  // Compute features per outlet
  const features = outlets.map(outlet => {
    const outletSales = monthlySales.filter(s => s.outletId === outlet.outletId);

    // Total annual volume
    const totalUnits = outletSales.reduce((s, r) => s + r.units, 0);
    const totalRevenue = outletSales.reduce((s, r) => s + r.revenue, 0);

    // SKU breadth
    const uniqueSkus = new Set(outletSales.filter(r => r.units > 0).map(r => r.skuId));
    const skuBreadth = uniqueSkus.size;

    // Premium share (% of revenue from premium SKUs)
    const premiumRevenue = outletSales
      .filter(r => skuMap[r.skuId]?.marginTier === 'premium')
      .reduce((s, r) => s + r.revenue, 0);
    const premiumShare = totalRevenue > 0 ? premiumRevenue / totalRevenue : 0;

    // Malt/drink share
    const maltRevenue = outletSales
      .filter(r => ['malt_beverage', 'powdered_drink'].includes(skuMap[r.skuId]?.category))
      .reduce((s, r) => s + r.revenue, 0);
    const maltShare = totalRevenue > 0 ? maltRevenue / totalRevenue : 0;

    // Festival spike ratio (Diwali months 10-11 vs average)
    const diwaliSales = outletSales
      .filter(r => r.month >= 10 && r.month <= 11)
      .reduce((s, r) => s + r.revenue, 0);
    const avgMonthRevenue = totalRevenue / 12;
    const festivalRatio = avgMonthRevenue > 0 ? (diwaliSales / 2) / avgMonthRevenue : 1;

    // Value pack share (% from value tier)
    const valueRevenue = outletSales
      .filter(r => skuMap[r.skuId]?.marginTier === 'value')
      .reduce((s, r) => s + r.revenue, 0);
    const valueShare = totalRevenue > 0 ? valueRevenue / totalRevenue : 0;

    return {
      outletId: outlet.outletId,
      channelType: outlet.channelType,
      totalUnits,
      totalRevenue,
      skuBreadth,
      premiumShare,
      maltShare,
      festivalRatio,
      valueShare,
    };
  });

  // Simple rule-based classification (mimics cluster output)
  const results = features.map(f => {
    let archetypeId;

    if (f.totalRevenue < getPercentile(features.map(x => x.totalRevenue), 15)) {
      archetypeId = 'underperforming';
    } else if (f.channelType === 'paan-plus' || (f.valueShare > 0.6 && f.skuBreadth <= 10)) {
      archetypeId = 'impulse_transit';
    } else if (f.premiumShare > 0.35 && f.totalRevenue > getPercentile(features.map(x => x.totalRevenue), 50)) {
      archetypeId = 'premium_urban';
    } else if (f.maltShare > 0.25) {
      archetypeId = 'steady_staples';
    } else if (f.festivalRatio > 2.0) {
      archetypeId = 'festival_spiker';
    } else {
      archetypeId = 'value_suburban';
    }

    return {
      outletId: f.outletId,
      archetypeId,
      features: f,
    };
  });

  // Build archetype summaries
  const archetypes = ARCHETYPE_DEFS.map(def => {
    const members = results.filter(r => r.archetypeId === def.id);
    const avgRevenue = members.length > 0
      ? members.reduce((s, m) => s + m.features.totalRevenue, 0) / members.length
      : 0;
    const avgBreadth = members.length > 0
      ? members.reduce((s, m) => s + m.features.skuBreadth, 0) / members.length
      : 0;

    return {
      ...def,
      outletCount: members.length,
      avgAnnualRevenue: Math.round(avgRevenue),
      avgSkuBreadth: Math.round(avgBreadth * 10) / 10,
      outletIds: members.map(m => m.outletId),
    };
  });

  return { assignments: results, archetypes };
}

export function getArchetypeDefs() {
  return ARCHETYPE_DEFS;
}

// --- Helpers ---

function getPercentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[idx] || 0;
}
