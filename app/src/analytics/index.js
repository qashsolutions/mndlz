/**
 * Analytics Engine — Main Entry Point
 * Orchestrates all analytics modules and provides a single API for the frontend.
 * // HOOK: Replace individual modules with real ML endpoints as they become available
 */

import { detectStockoutsMonthly, stockoutSummary } from './stockoutDetection.js';
import { generateForecasts, forecastAccuracy } from './demandForecast.js';
import { assignArchetypes } from './outletArchetypes.js';
import { computeIdealBaskets } from './smartBasket.js';
import { runLiftSimulation } from './liftSimulation.js';

export { detectStockouts, detectStockoutsMonthly, stockoutSummary } from './stockoutDetection.js';
export { generateForecasts, forecastAccuracy, forecastNext4Weeks } from './demandForecast.js';
export { assignArchetypes, getArchetypeDefs } from './outletArchetypes.js';
export { computeIdealBaskets, outletBasketComparison } from './smartBasket.js';
export { runLiftSimulation } from './liftSimulation.js';

/**
 * Run full analytics pipeline. Returns all computed results.
 * Call once on app init, cache the results.
 */
export function runFullPipeline(data) {
  const { outlets, skus, monthlySales, weeklySales, schemes } = data;

  // 1. Stockout detection (monthly — uses all outlets)
  const stockoutEvents = detectStockoutsMonthly(monthlySales, skus);
  const stockoutStats = stockoutSummary(stockoutEvents);

  // 2. Archetypes
  const archetypeResult = assignArchetypes(outlets, monthlySales, skus);

  // 3. Ideal baskets
  const idealBaskets = computeIdealBaskets(archetypeResult, monthlySales, skus);

  // 4. Lift simulation
  const liftResult = runLiftSimulation(archetypeResult, idealBaskets, monthlySales, skus);

  // 5. Forecast accuracy (only on weekly detail data if available)
  let forecastStats = null;
  if (weeklySales && weeklySales.length > 0) {
    const forecasts = generateForecasts(weeklySales, schemes);
    forecastStats = forecastAccuracy(forecasts);
  }

  return {
    stockoutEvents,
    stockoutStats,
    archetypeResult,
    idealBaskets,
    liftResult,
    forecastStats,
  };
}
