/**
 * Demand Forecasting Module (Simulated)
 * Uses trailing average + seasonal adjustment + linear trend.
 * // HOOK: Replace with ML forecast model endpoint
 */

/**
 * Generate a 4-week forecast for each outlet-SKU from weekly data.
 * Also computes historical "backtested" accuracy.
 */
export function generateForecasts(weeklyData, schemes) {
  const grouped = {};
  for (const row of weeklyData) {
    const key = `${row.outletId}|${row.skuId}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  // Build seasonal multiplier lookup from schemes
  const seasonalMultipliers = buildSeasonalMultipliers(schemes);

  const forecasts = [];

  for (const [key, rows] of Object.entries(grouped)) {
    rows.sort((a, b) => a.week - b.week);
    const [outletId, skuId] = key.split('|');

    // Generate historical backtested forecasts (from week 9 onward)
    for (let i = 8; i < rows.length; i++) {
      const window = rows.slice(Math.max(0, i - 8), i);
      const nonZero = window.filter(w => w.units > 0);
      const trailingAvg = nonZero.length > 0
        ? nonZero.reduce((s, w) => s + w.units, 0) / nonZero.length
        : 0;

      // Linear trend from last 12 weeks
      const trendWindow = rows.slice(Math.max(0, i - 12), i);
      const slope = computeSlope(trendWindow.map(w => w.units));

      // Seasonal adjustment
      const targetWeek = rows[i].week;
      const seasonalMult = getSeasonalMultiplier(skuId, targetWeek, seasonalMultipliers);

      const predicted = Math.max(0, Math.round((trailingAvg + slope * 4) * seasonalMult));
      const actual = rows[i].units;

      forecasts.push({
        outletId,
        skuId,
        week: targetWeek,
        predicted,
        actual,
        error: actual > 0 ? Math.abs(predicted - actual) / actual : null,
      });
    }
  }

  return forecasts;
}

/**
 * Compute forecast accuracy metrics.
 */
export function forecastAccuracy(forecasts) {
  const validForecasts = forecasts.filter(f => f.error !== null && f.actual > 0);
  if (validForecasts.length === 0) return { mape: 0, accuracy: 100, n: 0 };

  const mape = validForecasts.reduce((s, f) => s + f.error, 0) / validForecasts.length;
  return {
    mape: Math.round(mape * 1000) / 10, // percentage
    accuracy: Math.round((1 - mape) * 1000) / 10,
    n: validForecasts.length,
  };
}

/**
 * Generate next-4-week forecast for a specific outlet-SKU.
 */
export function forecastNext4Weeks(weeklyData, outletId, skuId, schemes) {
  const rows = weeklyData
    .filter(r => r.outletId === outletId && r.skuId === skuId)
    .sort((a, b) => a.week - b.week);

  if (rows.length < 4) return [];

  const seasonalMultipliers = buildSeasonalMultipliers(schemes);
  const last8 = rows.slice(-8);
  const nonZero = last8.filter(w => w.units > 0);
  const trailingAvg = nonZero.length > 0
    ? nonZero.reduce((s, w) => s + w.units, 0) / nonZero.length
    : 0;

  const last12 = rows.slice(-12);
  const slope = computeSlope(last12.map(w => w.units));

  const lastWeek = rows[rows.length - 1].week;
  const predictions = [];

  for (let w = 1; w <= 4; w++) {
    const futureWeek = ((lastWeek + w - 1) % 52) + 1;
    const seasonalMult = getSeasonalMultiplier(skuId, futureWeek, seasonalMultipliers);
    const predicted = Math.max(0, Math.round((trailingAvg + slope * w) * seasonalMult));
    predictions.push({ week: futureWeek, predicted });
  }

  return predictions;
}

// --- Helpers ---

function computeSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function buildSeasonalMultipliers(schemes) {
  const map = {}; // skuId -> week -> multiplier
  for (const s of schemes) {
    for (const skuId of s.skuIds) {
      if (!map[skuId]) map[skuId] = {};
      for (let w = s.startWeek; w <= s.endWeek; w++) {
        map[skuId][w] = Math.max(map[skuId][w] || 1, s.boost);
      }
    }
  }
  return map;
}

function getSeasonalMultiplier(skuId, week, multipliers) {
  return multipliers[skuId]?.[week] || 1.0;
}
