/**
 * Lift Simulation Module
 * Splits outlets into test (smart basket) and control groups.
 * Simulates 90-day pilot outcome.
 * // HOOK: Replace with real A/B test framework and live data
 */

/**
 * Run the lift simulation.
 * - Split 500 outlets into 250 test + 250 control, balanced by archetype.
 * - In test outlets: apply smart basket uplift to base sales.
 * - In control: keep base sales flat.
 * - Show cumulative difference over 90 days (~13 weeks).
 */
export function runLiftSimulation(archetypeResult, idealBaskets, monthlySales, skus) {
  const { assignments, archetypes } = archetypeResult;

  // Balanced split: for each archetype, take half into test, half into control
  const testOutlets = new Set();
  const controlOutlets = new Set();

  for (const arch of archetypes) {
    const shuffled = shuffleDeterministic(arch.outletIds, 123);
    const half = Math.ceil(shuffled.length / 2);
    for (let i = 0; i < shuffled.length; i++) {
      if (i < half) testOutlets.add(shuffled[i]);
      else controlOutlets.add(shuffled[i]);
    }
  }

  const skuMap = Object.fromEntries(skus.map(s => [s.skuId, s]));

  // Compute base weekly revenue per outlet (average from last 3 months: months 10-12)
  const outletBaseWeekly = {};
  for (const a of assignments) {
    const recentSales = monthlySales.filter(
      s => s.outletId === a.outletId && s.month >= 10
    );
    const totalRevenue = recentSales.reduce((s, r) => s + r.revenue, 0);
    // 3 months ≈ 13 weeks
    outletBaseWeekly[a.outletId] = totalRevenue / 13;
  }

  // Compute uplift per test outlet from smart basket
  const outletUpliftWeekly = {};
  for (const outletId of testOutlets) {
    const assignment = assignments.find(a => a.outletId === outletId);
    if (!assignment) continue;
    const ideal = idealBaskets[assignment.archetypeId] || [];

    // Outlet's current weekly revenue
    const outletSales = monthlySales.filter(s => s.outletId === outletId && s.month >= 10);
    const currentBySkuMonthly = {};
    for (const s of outletSales) {
      if (!currentBySkuMonthly[s.skuId]) currentBySkuMonthly[s.skuId] = 0;
      currentBySkuMonthly[s.skuId] += s.units;
    }

    let upliftWeekly = 0;
    for (const item of ideal) {
      const currentMonthly = currentBySkuMonthly[item.skuId] || 0;
      const currentWeekly = currentMonthly / 13;
      const gap = item.weeklyIdeal - currentWeekly;
      // Cap at 2x
      const maxUplift = currentWeekly > 0 ? currentWeekly * 2 : item.weeklyIdeal;
      const cappedGap = Math.min(Math.max(0, gap), maxUplift);
      upliftWeekly += cappedGap * item.mrp;
    }

    // Apply only 60% of theoretical uplift (realistic adoption rate)
    outletUpliftWeekly[outletId] = upliftWeekly * 0.6;
  }

  // Simulate 13 weeks (90 days)
  const WEEKS = 13;
  const weeklyData = [];
  let testCumulative = 0;
  let controlCumulative = 0;

  for (let w = 1; w <= WEEKS; w++) {
    let testWeekly = 0;
    let controlWeekly = 0;

    for (const outletId of testOutlets) {
      const base = outletBaseWeekly[outletId] || 0;
      // Ramp up uplift: week 1 = 20% effect, ramping to 100% by week 6
      const rampFactor = Math.min(1, 0.2 + (w - 1) * 0.16);
      testWeekly += base + (outletUpliftWeekly[outletId] || 0) * rampFactor;
    }

    for (const outletId of controlOutlets) {
      controlWeekly += outletBaseWeekly[outletId] || 0;
    }

    testCumulative += testWeekly;
    controlCumulative += controlWeekly;

    weeklyData.push({
      week: w,
      testWeekly: Math.round(testWeekly),
      controlWeekly: Math.round(controlWeekly),
      testCumulative: Math.round(testCumulative),
      controlCumulative: Math.round(controlCumulative),
      lift: Math.round(testCumulative - controlCumulative),
      liftPct: controlCumulative > 0
        ? Math.round(((testCumulative - controlCumulative) / controlCumulative) * 1000) / 10
        : 0,
    });
  }

  const finalWeek = weeklyData[weeklyData.length - 1];

  return {
    testOutletCount: testOutlets.size,
    controlOutletCount: controlOutlets.size,
    weeklyData,
    summary: {
      totalTestRevenue: finalWeek.testCumulative,
      totalControlRevenue: finalWeek.controlCumulative,
      incrementalRevenue: finalWeek.lift,
      liftPercent: finalWeek.liftPct,
      incrementalRevenueLakhs: Math.round(finalWeek.lift / 100000 * 10) / 10,
    },
    recommendation: finalWeek.liftPct >= 5
      ? { decision: 'SCALE', rationale: generateScaleRationale(finalWeek, testOutlets.size) }
      : { decision: 'ITERATE', rationale: 'Lift below 5% threshold. Recommend refining basket model and extending pilot duration.' },
  };
}

// --- Helpers ---

function shuffleDeterministic(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateScaleRationale(finalWeek, testCount) {
  return [
    `${finalWeek.liftPct}% lift in secondary sales over 90 days across ${testCount} test outlets.`,
    `Incremental revenue of ₹${(finalWeek.lift / 100000).toFixed(1)} lakhs in pilot period.`,
    `Annualized impact: ₹${(finalWeek.lift * 4 / 100000).toFixed(1)} lakhs for this territory alone.`,
    `Recommendation: Scale smart basket to full territory and expand to adjacent ZSM territories.`,
  ];
}
