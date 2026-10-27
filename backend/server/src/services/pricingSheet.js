// Reads pricing data (Fabric, Outfit, Price Brackets tabs) from Google Sheets.
// Reused from the old outfit widget. Kept in memory and refreshed every
// PRICING_REFRESH_INTERVAL_MINUTES. If Google Sheets fails, the last good copy is used.
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const env = require("../config/env");
const { AppError } = require("../lib/errors");

let cache = { fabricWeights: null, outfits: null, priceBrackets: null, lastUpdated: null };
let refreshTimer = null;
let lastAttempt = 0;
let inFlight = null;

function getAuth() {
  return new JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function parseFabricSheet(rows) {
  const fabricWeights = {};
  for (const row of rows) {
    const name = (row.get("Fabric") || "").trim();
    if (!name) continue;
    const weight = Number(row.get("Weight"));
    if (Number.isNaN(weight)) throw new Error(`Fabric tab: "${name}" has a non-numeric or missing Weight.`);
    fabricWeights[name] = weight;
  }
  return fabricWeights;
}

function parseOutfitSheet(rows) {
  const outfits = {};
  for (const row of rows) {
    const name = (row.get("Outfit") || "").trim();
    if (!name) continue;
    const fields = {
      weight: Number(row.get("Weight")),
      metreage: Number(row.get("Metreage")),
      metreageWeight: Number(row.get("Metreage Weight")),
      lining: Number(row.get("Lining")),
      liningWeight: Number(row.get("Lining Weight")),
    };
    for (const [field, value] of Object.entries(fields)) {
      if (Number.isNaN(value)) throw new Error(`Outfit tab: "${name}" has a non-numeric or missing "${field}".`);
    }
    const description = (row.get("Description") || "").trim();
    outfits[name] = { ...fields, description };
  }
  return outfits;
}

function parsePriceBracketsSheet(rows) {
  const brackets = [];
  for (const row of rows) {
    const label = (row.get("Price Brackets") || "").trim();
    if (!label) continue;
    const match = label.replace(/,/g, "").match(/(\d+)\D+(\d+)/);
    if (!match) throw new Error(`Price Brackets tab: could not read a price range from "${label}".`);
    const scoreMin = Number(row.get("Score Min"));
    const scoreMax = Number(row.get("Score Max"));
    if (Number.isNaN(scoreMin) || Number.isNaN(scoreMax)) {
      throw new Error(`Price Brackets tab: "${label}" has a non-numeric Score Min/Max.`);
    }
    brackets.push({ priceMin: Number(match[1]), priceMax: Number(match[2]), scoreMin, scoreMax });
  }
  brackets.sort((a, b) => a.scoreMin - b.scoreMin);
  return brackets;
}

async function fetchAndParse() {
  const doc = new GoogleSpreadsheet(env.GOOGLE_SHEET_ID, getAuth());
  await doc.loadInfo();
  const fabricSheet = doc.sheetsByTitle["Fabric"];
  const outfitSheet = doc.sheetsByTitle["Outfit"];
  const bracketsSheet = doc.sheetsByTitle["Price Brackets"];
  if (!fabricSheet || !outfitSheet || !bracketsSheet) {
    throw new Error(
      `Expected tabs "Fabric", "Outfit", "Price Brackets". Found: ${Object.keys(doc.sheetsByTitle).join(", ")}`
    );
  }
  const [fabricRows, outfitRows, bracketRows] = await Promise.all([
    fabricSheet.getRows(),
    outfitSheet.getRows(),
    bracketsSheet.getRows(),
  ]);
  const parsed = {
    fabricWeights: parseFabricSheet(fabricRows),
    outfits: parseOutfitSheet(outfitRows),
    priceBrackets: parsePriceBracketsSheet(bracketRows),
  };
  if (!Object.keys(parsed.fabricWeights).length) throw new Error("Fabric tab is empty.");
  if (!Object.keys(parsed.outfits).length) throw new Error("Outfit tab is empty.");
  if (!parsed.priceBrackets.length) throw new Error("Price Brackets tab is empty.");
  return parsed;
}

async function refresh() {
  if (inFlight) return inFlight;
  lastAttempt = Date.now();
  inFlight = (async () => {
    try {
      const fresh = await fetchAndParse();
      cache = { ...fresh, lastUpdated: new Date() };
      console.log(`[pricing] Loaded from Google Sheets at ${cache.lastUpdated.toISOString()}`);
    } catch (err) {
      console.error(`[pricing] Refresh failed: ${err.message}`);
      if (cache.lastUpdated) console.error("[pricing] Using the last good copy.");
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refresh, env.PRICING_REFRESH_INTERVAL_MINUTES * 60 * 1000);
  refreshTimer.unref();
}

/** Returns loaded data, trying once more if nothing is loaded yet. */
async function getData() {
  if (!cache.lastUpdated && Date.now() - lastAttempt > 30_000) await refresh();
  if (!cache.lastUpdated) {
    throw new AppError(503, "PRICING_UNAVAILABLE", "Price estimates are unavailable right now. Please try again shortly.");
  }
  return cache;
}

module.exports = { refresh, startAutoRefresh, getData };
