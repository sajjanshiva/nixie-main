const { randomHex } = require("./crypto");

/** "Red Bridal Lehenga!" → "red-bridal-lehenga-3f9a1c" (random end keeps it unique). */
function makeSlug(title) {
  const base = String(title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${base || "outfit"}-${randomHex(3)}`;
}

module.exports = { makeSlug };
