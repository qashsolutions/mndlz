#!/usr/bin/env node
/**
 * Mondelez India GT Intelligence — Synthetic Data Generator
 * Generates 7 JSON datasets for the interactive prototype.
 * All data is synthetic but designed to be plausible for a Mondelez India GT channel demo.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data');
mkdirSync(OUT_DIR, { recursive: true });

// ============================================================
// SEEDED RANDOM — deterministic output for reproducibility
// ============================================================
let _seed = 42;
function seededRandom() {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function randInt(min, max) {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}
function randFloat(min, max) {
  return seededRandom() * (max - min) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gaussRandom(mean, stddev) {
  // Box-Muller transform
  const u1 = seededRandom();
  const u2 = seededRandom();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

// ============================================================
// 1. SKU MASTER (20 SKUs)
// ============================================================
const skus = [
  { skuId: 'SKU001', name: 'Cadbury Dairy Milk 25g', brand: 'Dairy Milk', category: 'chocolate', packSize: '25g', mrp: 20, marginTier: 'value', baseVelocity: 12 },
  { skuId: 'SKU002', name: 'Cadbury Dairy Milk 50g', brand: 'Dairy Milk', category: 'chocolate', packSize: '50g', mrp: 40, marginTier: 'mid', baseVelocity: 8 },
  { skuId: 'SKU003', name: 'Cadbury Dairy Milk Silk', brand: 'Silk', category: 'chocolate', packSize: '60g', mrp: 80, marginTier: 'premium', baseVelocity: 5 },
  { skuId: 'SKU004', name: 'Cadbury Dairy Milk Silk Bubbly', brand: 'Silk', category: 'chocolate', packSize: '50g', mrp: 85, marginTier: 'premium', baseVelocity: 3 },
  { skuId: 'SKU005', name: '5 Star 22g', brand: '5 Star', category: 'chocolate', packSize: '22g', mrp: 10, marginTier: 'value', baseVelocity: 15 },
  { skuId: 'SKU006', name: '5 Star 40g', brand: '5 Star', category: 'chocolate', packSize: '40g', mrp: 20, marginTier: 'value', baseVelocity: 7 },
  { skuId: 'SKU007', name: 'Oreo Original', brand: 'Oreo', category: 'biscuit', packSize: '46.3g', mrp: 10, marginTier: 'value', baseVelocity: 14 },
  { skuId: 'SKU008', name: 'Oreo Chocolate Creme', brand: 'Oreo', category: 'biscuit', packSize: '46.3g', mrp: 10, marginTier: 'value', baseVelocity: 10 },
  { skuId: 'SKU009', name: 'Perk 22g', brand: 'Perk', category: 'chocolate', packSize: '22g', mrp: 10, marginTier: 'value', baseVelocity: 11 },
  { skuId: 'SKU010', name: 'Gems 18g', brand: 'Gems', category: 'chocolate', packSize: '18g', mrp: 10, marginTier: 'value', baseVelocity: 13 },
  { skuId: 'SKU011', name: 'Gems Packet', brand: 'Gems', category: 'chocolate', packSize: '36g', mrp: 20, marginTier: 'value', baseVelocity: 6 },
  { skuId: 'SKU012', name: 'Cadbury Celebrations Pack', brand: 'Celebrations', category: 'chocolate', packSize: '136g', mrp: 150, marginTier: 'premium', baseVelocity: 1 },
  { skuId: 'SKU013', name: 'Bournville Dark', brand: 'Bournville', category: 'chocolate', packSize: '80g', mrp: 100, marginTier: 'premium', baseVelocity: 2 },
  { skuId: 'SKU014', name: 'Cadbury Chocobakes', brand: 'Chocobakes', category: 'biscuit', packSize: '38g', mrp: 15, marginTier: 'value', baseVelocity: 9 },
  { skuId: 'SKU015', name: 'Bournvita 200g', brand: 'Bournvita', category: 'malt_beverage', packSize: '200g', mrp: 95, marginTier: 'mid', baseVelocity: 4 },
  { skuId: 'SKU016', name: 'Bournvita 500g', brand: 'Bournvita', category: 'malt_beverage', packSize: '500g', mrp: 210, marginTier: 'mid', baseVelocity: 3 },
  { skuId: 'SKU017', name: 'Tang 500g', brand: 'Tang', category: 'powdered_drink', packSize: '500g', mrp: 150, marginTier: 'mid', baseVelocity: 3 },
  { skuId: 'SKU018', name: 'Cadbury Dairy Milk Fruit & Nut', brand: 'Dairy Milk', category: 'chocolate', packSize: '80g', mrp: 90, marginTier: 'premium', baseVelocity: 3 },
  { skuId: 'SKU019', name: 'Cadbury Fuse 45g', brand: 'Fuse', category: 'chocolate', packSize: '45g', mrp: 35, marginTier: 'mid', baseVelocity: 6 },
  { skuId: 'SKU020', name: 'Oreo Mini Pack', brand: 'Oreo', category: 'biscuit', packSize: '20g', mrp: 5, marginTier: 'value', baseVelocity: 18 },
];

// ============================================================
// 2. HYDERABAD AREAS, PIN CODES, COORDINATES
// ============================================================
const hyderabadAreas = [
  { area: 'Ameerpet', pin: '500016', lat: 17.4375, lng: 78.4483 },
  { area: 'Kukatpally', pin: '500072', lat: 17.4849, lng: 78.3997 },
  { area: 'Dilsukhnagar', pin: '500060', lat: 17.3687, lng: 78.5247 },
  { area: 'Begumpet', pin: '500016', lat: 17.4440, lng: 78.4719 },
  { area: 'Secunderabad', pin: '500003', lat: 17.4399, lng: 78.4983 },
  { area: 'Madhapur', pin: '500081', lat: 17.4484, lng: 78.3908 },
  { area: 'Gachibowli', pin: '500032', lat: 17.4401, lng: 78.3489 },
  { area: 'Jubilee Hills', pin: '500033', lat: 17.4325, lng: 78.4073 },
  { area: 'Banjara Hills', pin: '500034', lat: 17.4138, lng: 78.4383 },
  { area: 'Himayath Nagar', pin: '500029', lat: 17.3951, lng: 78.4866 },
  { area: 'Mehdipatnam', pin: '500028', lat: 17.3950, lng: 78.4423 },
  { area: 'Tolichowki', pin: '500008', lat: 17.3975, lng: 78.4120 },
  { area: 'LB Nagar', pin: '500074', lat: 17.3480, lng: 78.5519 },
  { area: 'Uppal', pin: '500039', lat: 17.4015, lng: 78.5593 },
  { area: 'Habsiguda', pin: '500007', lat: 17.4059, lng: 78.5360 },
  { area: 'Tarnaka', pin: '500017', lat: 17.4246, lng: 78.5340 },
  { area: 'Malkajgiri', pin: '500047', lat: 17.4533, lng: 78.5212 },
  { area: 'Kompally', pin: '500014', lat: 17.5340, lng: 78.4847 },
  { area: 'Miyapur', pin: '500049', lat: 17.4965, lng: 78.3523 },
  { area: 'Chandanagar', pin: '500050', lat: 17.4868, lng: 78.3310 },
  { area: 'Lingampally', pin: '500019', lat: 17.4917, lng: 78.3179 },
  { area: 'Kothapet', pin: '500035', lat: 17.3626, lng: 78.5479 },
  { area: 'Nacharam', pin: '500076', lat: 17.4117, lng: 78.5585 },
  { area: 'Alwal', pin: '500010', lat: 17.4960, lng: 78.5183 },
  { area: 'Bowenpally', pin: '500011', lat: 17.4678, lng: 78.4797 },
  { area: 'Trimulgherry', pin: '500015', lat: 17.4801, lng: 78.5047 },
  { area: 'Nampally', pin: '500001', lat: 17.3880, lng: 78.4734 },
  { area: 'Abids', pin: '500001', lat: 17.3925, lng: 78.4750 },
  { area: 'Charminar', pin: '500002', lat: 17.3616, lng: 78.4747 },
  { area: 'Malakpet', pin: '500036', lat: 17.3756, lng: 78.5008 },
];

// ============================================================
// 3. OUTLET NAME TEMPLATES
// ============================================================
const firstNames = [
  'Sharma', 'Reddy', 'Krishna', 'Lakshmi', 'Srinivas', 'Ramesh', 'Suresh', 'Venkat',
  'Ravi', 'Ganesh', 'Sai', 'Balaji', 'Mahesh', 'Patel', 'Kumar', 'Prasad',
  'Murthy', 'Rao', 'Naidu', 'Swamy', 'Raju', 'Mohan', 'Anil', 'Vijay',
  'Satish', 'Kiran', 'Sekhar', 'Deepak', 'Ashok', 'Rajesh', 'Srikanth', 'Madhu',
  'Govind', 'Shiva', 'Bhanu', 'Chandra', 'Srinath', 'Padma', 'Sridevi', 'Jyothi'
];
const suffixes = [
  'General Store', 'Kirana Store', 'Provision Store', 'Traders', 'Mart',
  'Kirana & General', 'Grocery', 'Super Market', 'Kiryana', 'Shop'
];
const prefixes = ['Sri', 'Shri', 'New', 'Maa', 'Om', '', '', '', '', ''];

function generateShopName(idx) {
  const fn = firstNames[idx % firstNames.length];
  const sf = suffixes[randInt(0, suffixes.length - 1)];
  const pf = prefixes[randInt(0, prefixes.length - 1)];
  const name = pf ? `${pf} ${fn} ${sf}` : `${fn} ${sf}`;
  return name;
}

// ============================================================
// 4. CHANNEL TYPES
// ============================================================
const channelTypes = ['grocery', 'paan-plus', 'general', 'cosmetic'];
const channelWeights = [0.40, 0.20, 0.30, 0.10];
function pickChannel() {
  const r = seededRandom();
  let cum = 0;
  for (let i = 0; i < channelTypes.length; i++) {
    cum += channelWeights[i];
    if (r < cum) return channelTypes[i];
  }
  return channelTypes[channelTypes.length - 1];
}

// ============================================================
// 5. GENERATE OUTLETS (500)
// ============================================================
const NUM_OUTLETS = 500;
const NUM_BEATS = 40;
const beatDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const outlets = [];
for (let i = 0; i < NUM_OUTLETS; i++) {
  const areaInfo = hyderabadAreas[i % hyderabadAreas.length];
  const lat = areaInfo.lat + randFloat(-0.008, 0.008);
  const lng = areaInfo.lng + randFloat(-0.008, 0.008);
  const beatId = (i % NUM_BEATS) + 1;
  const channel = pickChannel();

  outlets.push({
    outletId: `OUT${String(i + 1).padStart(4, '0')}`,
    name: generateShopName(i),
    pinCode: areaInfo.pin,
    area: areaInfo.area,
    channelType: channel,
    beatId,
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
  });
}

// ============================================================
// 6. GENERATE BEATS (40)
// ============================================================
const beats = [];
for (let b = 1; b <= NUM_BEATS; b++) {
  const day = beatDays[(b - 1) % beatDays.length];
  const outletIds = outlets.filter(o => o.beatId === b).map(o => o.outletId);
  beats.push({
    beatId: b,
    name: `Beat ${String(b).padStart(2, '0')}`,
    visitDay: day,
    outletCount: outletIds.length,
    outletIds,
  });
}

// ============================================================
// 7. SCHEME CALENDAR (8 promotions)
// ============================================================
const schemes = [
  { schemeId: 'SCH001', name: 'Valentine\'s Silk Campaign', startWeek: 5, endWeek: 7, skuIds: ['SKU003', 'SKU004', 'SKU018'], boost: 2.2, description: 'Push premium Silk range for Valentine\'s gifting' },
  { schemeId: 'SCH002', name: 'Summer Tang Drive', startWeek: 14, endWeek: 22, skuIds: ['SKU017'], boost: 2.5, description: 'Summer hydration push for Tang' },
  { schemeId: 'SCH003', name: 'Back-to-School Bournvita', startWeek: 23, endWeek: 26, skuIds: ['SKU015', 'SKU016'], boost: 1.6, description: 'School reopening nutrition campaign' },
  { schemeId: 'SCH004', name: 'Rakhi Celebrations', startWeek: 32, endWeek: 34, skuIds: ['SKU003', 'SKU012', 'SKU018'], boost: 2.0, description: 'Rakhi gifting — Silk + Celebrations push' },
  { schemeId: 'SCH005', name: 'Independence Day Mega Pack', startWeek: 33, endWeek: 34, skuIds: ['SKU001', 'SKU005', 'SKU007', 'SKU010'], boost: 1.4, description: 'National holiday value pack promotion' },
  { schemeId: 'SCH006', name: 'Navratri Impulse Drive', startWeek: 40, endWeek: 42, skuIds: ['SKU005', 'SKU009', 'SKU010', 'SKU020'], boost: 1.5, description: 'Festival season impulse purchase push' },
  { schemeId: 'SCH007', name: 'Diwali Celebrations Mega Push', startWeek: 43, endWeek: 45, skuIds: ['SKU003', 'SKU004', 'SKU012', 'SKU013', 'SKU018'], boost: 3.0, description: 'Diwali gifting — the biggest push of the year' },
  { schemeId: 'SCH008', name: 'New Year Oreo Party', startWeek: 51, endWeek: 52, skuIds: ['SKU007', 'SKU008'], boost: 1.8, description: 'Year-end party push for Oreo variants' },
];

// ============================================================
// 8. SEASONAL & CHANNEL MODIFIERS
// ============================================================
// Chocolate melts in summer → retailer stops ordering
function summerChocolatePenalty(week, category) {
  if (category !== 'chocolate') return 1.0;
  if (week >= 14 && week <= 22) return 0.7; // 30% drop
  return 1.0;
}

// Small packs sell better in paan-plus / transit outlets
function channelSkuModifier(channel, marginTier) {
  if (channel === 'paan-plus' && marginTier === 'value') return 1.5;
  if (channel === 'paan-plus' && marginTier === 'premium') return 0.4;
  if (channel === 'cosmetic' && marginTier === 'premium') return 1.3;
  return 1.0;
}

// Scheme boost for a given SKU in a given week
function schemeBoost(skuId, week) {
  for (const s of schemes) {
    if (s.skuIds.includes(skuId) && week >= s.startWeek && week <= s.endWeek) {
      return s.boost;
    }
  }
  return 1.0;
}

// ============================================================
// 9. OUTLET PROFILES — determines volume tier & archetype seeds
// ============================================================
// Assign each outlet a "volume multiplier" and "sku breadth"
const outletProfiles = outlets.map((o, idx) => {
  const volumeMult = Math.max(0.2, gaussRandom(1.0, 0.4));
  // Premium outlets sell more Silk/Bournville
  const premiumAffinity = (o.channelType === 'cosmetic' || o.area === 'Jubilee Hills' || o.area === 'Banjara Hills' || o.area === 'Madhapur')
    ? randFloat(1.4, 2.0) : randFloat(0.5, 1.2);
  // Breadth: how many SKUs this outlet carries (8-20)
  const skuBreadth = randInt(8, 20);
  // Determine which SKUs this outlet carries
  const shuffledSkus = shuffle(skus.map(s => s.skuId));
  const carriedSkus = new Set(shuffledSkus.slice(0, skuBreadth));
  // Always carry at least Dairy Milk 25g and Oreo Original (staples)
  carriedSkus.add('SKU001');
  carriedSkus.add('SKU007');

  return {
    outletId: o.outletId,
    volumeMult,
    premiumAffinity,
    carriedSkus,
    // Mark some outlets as chronic stockout prone
    chronicStockoutSkus: seededRandom() < 0.12 ? new Set(shuffle([...carriedSkus]).slice(0, randInt(1, 3))) : new Set(),
  };
});

// ============================================================
// 10. GENERATE SALES DATA
// ============================================================
// Monthly aggregated: 500 outlets × 20 SKUs × 12 months = up to 120,000 rows
// But only for SKUs the outlet actually carries → ~72,000 rows
// Plus weekly detail for 50 outlets for drill-down

const WEEKS = 52;
const MONTHS = 12;
const weeksPerMonth = [4, 4, 5, 4, 4, 5, 4, 5, 4, 4, 5, 4]; // sums to 52
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// We need weekly data internally to do proper seasonality, then aggregate to monthly
const monthlySales = [];
const weeklySalesDetail = []; // only first 50 outlets
const DETAIL_OUTLETS = 50;

// Track stockout events for analytics
let totalStockoutEvents = 0;

for (let oi = 0; oi < NUM_OUTLETS; oi++) {
  const profile = outletProfiles[oi];
  const outlet = outlets[oi];

  for (const sku of skus) {
    if (!profile.carriedSkus.has(sku.skuId)) continue;

    // Base weekly velocity for this outlet-SKU
    const base = sku.baseVelocity * profile.volumeMult
      * channelSkuModifier(outlet.channelType, sku.marginTier)
      * (sku.marginTier === 'premium' ? profile.premiumAffinity : 1.0);

    let weekInYear = 0;
    const weeklyUnits = [];

    for (let w = 1; w <= WEEKS; w++) {
      let units = base;

      // Seasonal/scheme boost
      units *= schemeBoost(sku.skuId, w);
      units *= summerChocolatePenalty(w, sku.category);

      // Random noise ±20%
      units *= randFloat(0.80, 1.20);

      // Inject stockouts (~8% of outlet-SKU-weeks)
      let isStockout = false;
      if (profile.chronicStockoutSkus.has(sku.skuId)) {
        // Chronic: ~30% of weeks for this outlet-SKU
        if (seededRandom() < 0.30) { isStockout = true; }
      } else if (sku.category === 'chocolate' && w >= 14 && w <= 22 && seededRandom() < 0.15) {
        // Summer melt stockout
        isStockout = true;
      } else if (seededRandom() < 0.04) {
        // Random stockout
        isStockout = true;
      }

      if (isStockout) {
        units = 0;
        totalStockoutEvents++;
      } else {
        units = Math.max(0, Math.round(units));
      }

      weeklyUnits.push({ week: w, units, isStockout });

      // Weekly detail for first 50 outlets
      if (oi < DETAIL_OUTLETS) {
        weeklySalesDetail.push({
          outletId: outlet.outletId,
          skuId: sku.skuId,
          week: w,
          units,
          revenue: units * sku.mrp,
          isStockout,
        });
      }
    }

    // Aggregate to monthly
    let wIdx = 0;
    for (let m = 0; m < MONTHS; m++) {
      let monthUnits = 0;
      let monthStockouts = 0;
      const wInMonth = weeksPerMonth[m];
      for (let wi = 0; wi < wInMonth; wi++) {
        const wd = weeklyUnits[wIdx];
        monthUnits += wd.units;
        if (wd.isStockout) monthStockouts++;
        wIdx++;
      }

      monthlySales.push({
        outletId: outlet.outletId,
        skuId: sku.skuId,
        month: m + 1,
        monthName: monthNames[m],
        units: monthUnits,
        revenue: monthUnits * sku.mrp,
        stockoutWeeks: monthStockouts,
      });
    }
  }
}

console.log(`Generated ${monthlySales.length} monthly sales rows`);
console.log(`Generated ${weeklySalesDetail.length} weekly detail rows (${DETAIL_OUTLETS} outlets)`);
console.log(`Total stockout events injected: ${totalStockoutEvents}`);

// ============================================================
// 11. DISTRIBUTOR STOCK-ON-HAND (5 distributors × 20 SKUs × 12 months)
// ============================================================
const distributorNames = [
  'Hyderabad Metro Distribution Pvt Ltd',
  'Telangana Wholesale Traders',
  'Deccan FMCG Distributors',
  'Southern Star Distribution',
  'City Connect Supply Chain'
];

const distributors = [];
const distributorStock = [];

for (let d = 0; d < 5; d++) {
  const distId = `DIST${String(d + 1).padStart(3, '0')}`;
  // Each distributor serves ~100 outlets
  const servedOutlets = outlets.slice(d * 100, (d + 1) * 100).map(o => o.outletId);

  distributors.push({
    distributorId: distId,
    name: distributorNames[d],
    outletCount: servedOutlets.length,
    outletIds: servedOutlets,
  });

  for (const sku of skus) {
    for (let m = 1; m <= MONTHS; m++) {
      // Calculate total outlet demand for this SKU in this month
      const outletDemand = monthlySales
        .filter(s => servedOutlets.includes(s.outletId) && s.skuId === sku.skuId && s.month === m)
        .reduce((sum, s) => sum + s.units, 0);

      // Distributor usually holds 1.5-3x monthly demand
      // BUT sometimes has bullwhip: has stock while outlets are empty
      let closingStock = Math.round(outletDemand * randFloat(1.2, 3.0));

      // Occasionally distributor is also short
      if (seededRandom() < 0.08) {
        closingStock = Math.round(outletDemand * randFloat(0.1, 0.4));
      }

      distributorStock.push({
        distributorId: distId,
        skuId: sku.skuId,
        month: m,
        monthName: monthNames[m - 1],
        closingStock,
        estimatedOutletDemand: outletDemand,
      });
    }
  }
}

// ============================================================
// 12. RETURNS / EXPIRY (~3% of volume)
// ============================================================
const returns = [];
for (let oi = 0; oi < NUM_OUTLETS; oi++) {
  const outlet = outlets[oi];
  const profile = outletProfiles[oi];

  // Outlets that order infrequently but in bulk are more likely to return
  const returnProne = seededRandom() < 0.15;

  for (const sku of skus) {
    if (!profile.carriedSkus.has(sku.skuId)) continue;

    for (let m = 1; m <= MONTHS; m++) {
      const salesRow = monthlySales.find(
        s => s.outletId === outlet.outletId && s.skuId === sku.skuId && s.month === m
      );
      if (!salesRow || salesRow.units === 0) continue;

      let returnRate = 0.05; // base rate (effective ~3% after uniform random scaling)
      // Higher return in summer for chocolate
      if (sku.category === 'chocolate' && m >= 4 && m <= 7) {
        returnRate = 0.10;
      }
      if (returnProne) returnRate *= 2;

      const returnUnits = Math.round(salesRow.units * returnRate * seededRandom());
      if (returnUnits > 0) {
        returns.push({
          outletId: outlet.outletId,
          skuId: sku.skuId,
          month: m,
          monthName: monthNames[m - 1],
          returnUnits,
          returnValue: returnUnits * sku.mrp,
          reason: (sku.category === 'chocolate' && m >= 4 && m <= 7) ? 'melt/expiry' : 'expiry',
        });
      }
    }
  }
}
console.log(`Generated ${returns.length} return records`);

// ============================================================
// 13. WRITE JSON FILES
// ============================================================
function writeJSON(filename, data) {
  const path = join(OUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 0)); // compact for size
  const sizeMB = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2);
  console.log(`  ${filename}: ${data.length ?? Object.keys(data).length} entries, ${sizeMB} MB`);
}

console.log('\nWriting JSON files:');
writeJSON('skus.json', skus);
writeJSON('outlets.json', outlets);
writeJSON('beats.json', beats);
writeJSON('schemes.json', schemes);
writeJSON('sales-monthly.json', monthlySales);
writeJSON('sales-weekly-detail.json', weeklySalesDetail);
writeJSON('distributors.json', distributors);
writeJSON('distributor-stock.json', distributorStock);
writeJSON('returns.json', returns);

console.log('\nData generation complete!');
