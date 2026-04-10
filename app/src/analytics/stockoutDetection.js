/**
 * Stockout Detection Module
 * Detects probable stockout events using rolling velocity analysis.
 * // HOOK: Replace with real ML stockout prediction model endpoint
 */

/**
 * For each outlet-SKU, compute rolling 8-week average velocity from weekly data.
 * Flag weeks where actual = 0 but predicted velocity > 2 as "probable stockout."
 */
export function detectStockouts(weeklyData, skus) {
  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));
  const grouped = {};

  // Group by outlet-SKU
  for (const row of weeklyData) {
    const key = `${row.outletId}|${row.skuId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  const events = [];

  for (const [key, rows] of Object.entries(grouped)) {
    rows.sort((a, b) => a.week - b.week);
    const [outletId, skuId] = key.split('|');
    const sku = skuMap[skuId];

    for (let i = 0; i < rows.length; i++) {
      // Calculate rolling 8-week average (looking back)
      const start = Math.max(0, i - 8);
      const window = rows.slice(start, i);
      const nonZeroWeeks = window.filter(w => w.units > 0);
      const avgVelocity = nonZeroWeeks.length > 0
        ? nonZeroWeeks.reduce((s, w) => s + w.units, 0) / nonZeroWeeks.length
        : 0;

      if (rows[i].units === 0 && avgVelocity > 2) {
        let confidence;
        if (avgVelocity >= 10) confidence = 'high';
        else if (avgVelocity >= 5) confidence = 'medium';
        else confidence = 'low';

        events.push({
          outletId,
          skuId,
          skuName: sku?.name || skuId,
          week: rows[i].week,
          predictedVelocity: Math.round(avgVelocity * 10) / 10,
          confidence,
          revenueAtRisk: Math.round(avgVelocity * (sku?.mrp || 0)),
        });
      }
    }
  }

  return events;
}

/**
 * Compute stockout detection from monthly aggregated data.
 * Simpler version: flags months where stockoutWeeks > 0 and estimates revenue loss.
 */
export function detectStockoutsMonthly(monthlySales, skus) {
  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));
  const events = [];

  // Group by outlet-SKU to get velocity context
  const grouped = {};
  for (const row of monthlySales) {
    const key = `${row.outletId}|${row.skuId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  for (const [key, rows] of Object.entries(grouped)) {
    rows.sort((a, b) => a.month - b.month);
    const [outletId, skuId] = key.split('|');
    const sku = skuMap[skuId];

    for (let i = 0; i < rows.length; i++) {
      if (rows[i].stockoutWeeks > 0) {
        // Average velocity from non-zero months
        const nonZero = rows.filter(r => r.units > 0);
        const avgMonthly = nonZero.length > 0
          ? nonZero.reduce((s, r) => s + r.units, 0) / nonZero.length
          : 0;

        const avgWeekly = avgMonthly / 4;
        let confidence;
        if (avgWeekly >= 10) confidence = 'high';
        else if (avgWeekly >= 5) confidence = 'medium';
        else confidence = 'low';

        events.push({
          outletId,
          skuId,
          skuName: sku?.name || skuId,
          month: rows[i].month,
          monthName: rows[i].monthName,
          stockoutWeeks: rows[i].stockoutWeeks,
          predictedMonthlyUnits: Math.round(avgMonthly),
          confidence,
          revenueAtRisk: Math.round(rows[i].stockoutWeeks * avgWeekly * (sku?.mrp || 0)),
        });
      }
    }
  }

  return events;
}

/**
 * Aggregate stockout events into summary rollups.
 */
export function stockoutSummary(events) {
  const totalEvents = events.length;
  const totalRevenueAtRisk = events.reduce((s, e) => s + e.revenueAtRisk, 0);

  // By SKU
  const bySku = {};
  for (const e of events) {
    if (!bySku[e.skuId]) bySku[e.skuId] = { skuId: e.skuId, skuName: e.skuName, events: 0, revenueAtRisk: 0 };
    bySku[e.skuId].events++;
    bySku[e.skuId].revenueAtRisk += e.revenueAtRisk;
  }

  // By outlet
  const byOutlet = {};
  for (const e of events) {
    if (!byOutlet[e.outletId]) byOutlet[e.outletId] = { outletId: e.outletId, events: 0, revenueAtRisk: 0 };
    byOutlet[e.outletId].events++;
    byOutlet[e.outletId].revenueAtRisk += e.revenueAtRisk;
  }

  // By beat (needs outlet lookup — returned as outletId rollups for now)
  const byConfidence = { high: 0, medium: 0, low: 0 };
  for (const e of events) {
    byConfidence[e.confidence]++;
  }

  return {
    totalEvents,
    totalRevenueAtRisk,
    bySku: Object.values(bySku).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk),
    byOutlet: Object.values(byOutlet).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk),
    byConfidence,
  };
}
