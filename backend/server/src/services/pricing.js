// Deterministic price estimate (reused from the old widget).
//   combinedFabricWeight = primary + 0.35 × (sum of secondary fabric weights)
//   score = combinedFabricWeight + outfit weight + metreage weight + lining weight
//   price = 80% of the way through the matching price bracket
// The AI never decides the price — only this code does.
const C = require("../config/constants");
const { AppError } = require("../lib/errors");
const pricingSheet = require("./pricingSheet");

async function getLists() {
  const data = await pricingSheet.getData();
  const outfits = Object.entries(data.outfits)
    .map(([name, spec]) => ({ name, description: spec.description }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const fabrics = Object.keys(data.fabricWeights).sort();
  return { outfits, fabrics };
}

async function calculatePrice(outfitType, primaryFabric, secondaryFabrics = []) {
  const data = await pricingSheet.getData();
  const outfit = data.outfits[outfitType];
  const primaryWeight = data.fabricWeights[primaryFabric];
  if (!outfit || primaryWeight === undefined) {
    throw new AppError(502, "AI_ERROR", "Something went wrong analysing your photo. Please try again.");
  }
  const secondarySum = secondaryFabrics.reduce((sum, f) => sum + (data.fabricWeights[f] ?? 0), 0);
  const combined = primaryWeight + C.SECONDARY_FABRIC_DAMPING * secondarySum;
  // Round to 2 decimals so floating-point noise never misses a bracket edge.
  const score = Math.round((combined + outfit.weight + outfit.metreageWeight + outfit.liningWeight) * 100) / 100;

  const bracket = data.priceBrackets.find((b) => score >= b.scoreMin && score <= b.scoreMax);
  if (!bracket) {
    // Happens when the sheet has gaps between brackets (to be fixed in the sheet).
    console.warn(`[pricing] No bracket for score ${score} (outfit "${outfitType}"). Check gaps in the sheet.`);
    throw new AppError(
      422,
      "PRICE_UNAVAILABLE",
      "We couldn't estimate a price for this outfit right now. Please contact us and we'll help you."
    );
  }
  const price = Math.round(bracket.priceMin + C.BRACKET_FRACTION * (bracket.priceMax - bracket.priceMin));
  return { score, priceRupees: price };
}

module.exports = { getLists, calculatePrice };
