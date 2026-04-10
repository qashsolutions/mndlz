/**
 * Smart Basket Module
 * Computes per-archetype ideal baskets and per-outlet recommendations.
 * // HOOK: Replace with real recommendation engine / collaborative filtering model
 */

/**
 * Compute the ideal basket for each archetype.
 * Ideal = median weekly units per SKU across archetype members.
 */
export function computeIdealBaskets(archetypeResult, monthlySales, skus) {
  const { archetypes } = archetypeResult;
  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));
  const idealBaskets = {};

  for (const arch of archetypes) {
    if (arch.outletCount === 0) {
      idealBaskets[arch.id] = [];
      continue;
    }

    const basket = skus.map(sku => {
      // Get all outlet-monthly data for this archetype + SKU
      const salesForSku = monthlySales.filter(
        s => arch.outletIds.includes(s.outletId) && s.skuId === sku.skuId
      );

      // Average monthly units per outlet
      const outletMonthlyAvgs = {};
      for (const s of salesForSku) {
        if (!outletMonthlyAvgs[s.outletId]) outletMonthlyAvgs[s.outletId] = [];
        outletMonthlyAvgs[s.outletId].push(s.units);
      }

      const avgPerOutlet = Object.values(outletMonthlyAvgs).map(
        months => months.reduce((a, b) => a + b, 0) / months.length
      );

      // Median of averages → weekly (divide by 4)
      const medianMonthly = median(avgPerOutlet);
      const weeklyIdeal = Math.round((medianMonthly / 4) * 10) / 10;

      return {
        skuId: sku.skuId,
        skuName: sku.name,
        brand: sku.brand,
        category: sku.category,
        mrp: sku.mrp,
        weeklyIdeal,
        monthlyIdeal: Math.round(medianMonthly),
      };
    }).filter(item => item.weeklyIdeal > 0)
      .sort((a, b) => b.weeklyIdeal - a.weeklyIdeal);

    idealBaskets[arch.id] = basket;
  }

  return idealBaskets;
}

/**
 * Compare an individual outlet's ordering pattern to its archetype's ideal basket.
 * Returns gap analysis and uplift estimate.
 */
export function outletBasketComparison(outletId, archetypeResult, idealBaskets, monthlySales, skus) {
  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));
  const assignment = archetypeResult.assignments.find(a => a.outletId === outletId);
  if (!assignment) return null;

  const archetypeId = assignment.archetypeId;
  const ideal = idealBaskets[archetypeId] || [];

  // Outlet's actual average weekly ordering (last 8 weeks ≈ last 2 months)
  const outletSales = monthlySales.filter(s => s.outletId === outletId && s.month >= 11); // last 2 months
  const actualBySkuMonthly = {};
  for (const s of outletSales) {
    if (!actualBySkuMonthly[s.skuId]) actualBySkuMonthly[s.skuId] = 0;
    actualBySkuMonthly[s.skuId] += s.units;
  }
  // Convert to weekly average (2 months ≈ 8 weeks)
  const actualWeekly = {};
  for (const [skuId, total] of Object.entries(actualBySkuMonthly)) {
    actualWeekly[skuId] = Math.round((total / 8) * 10) / 10;
  }

  const comparison = ideal.map(item => {
    const current = actualWeekly[item.skuId] || 0;
    const gap = Math.round((item.weeklyIdeal - current) * 10) / 10;
    // Cap uplift at 2x current to avoid absurd numbers
    const maxUplift = current > 0 ? current * 2 : item.weeklyIdeal;
    const cappedGap = Math.min(gap, maxUplift);

    let status;
    if (current === 0 && item.weeklyIdeal > 0) status = 'missing'; // "add this SKU"
    else if (gap > item.weeklyIdeal * 0.3) status = 'under'; // significantly under
    else if (gap < -item.weeklyIdeal * 0.3) status = 'over'; // over-ordering
    else status = 'on_track';

    return {
      skuId: item.skuId,
      skuName: item.skuName,
      brand: item.brand,
      mrp: item.mrp,
      currentWeekly: current,
      idealWeekly: item.weeklyIdeal,
      gap,
      cappedGap: Math.round(cappedGap * 10) / 10,
      status,
      monthlyUpliftValue: Math.round(Math.max(0, cappedGap) * 4 * item.mrp),
    };
  });

  const totalMonthlyUplift = comparison.reduce((s, c) => s + c.monthlyUpliftValue, 0);

  return {
    outletId,
    archetypeId,
    archetypeName: archetypeResult.archetypes.find(a => a.id === archetypeId)?.name || archetypeId,
    comparison,
    totalMonthlyUplift,
    opportunities: comparison.filter(c => c.status === 'missing').length,
  };
}

// --- Helpers ---

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
