/**
 * formatQuantity.js
 *
 * Display-only smart number formatter for logistics / forecast UI.
 * NEVER mutates raw API data — call only at render time.
 *
 *  - Discrete units (bottles, boxes, kits, …)  → whole number  (Math.round)
 *  - Continuous units (liters, kg, ml, …)       → 1 decimal max (drops trailing .0)
 *  - Unknown / no unit                          → whole number (safe default)
 *  - null / undefined / NaN                     → "—"
 */

const DISCRETE_UNITS = new Set([
  "units",
  "unit",
  "boxes",
  "box",
  "kits",
  "kit",
  "bags",
  "bag",
  "vials",
  "vial",
  "pieces",
  "piece",
  "packs",
  "pack",
  "sets",
  "set",
  "rolls",
  "roll",
  "pairs",
  "pair",
  "tablets",
  "tablet",
  "capsules",
  "capsule",
  "bottles",
  "bottle",
  "ampules",
  "ampule",
  "syringes",
  "syringe",
  "tubes",
  "tube",
  "cans",
  "can",
  "sachets",
  "sachet",
  "strips",
  "strip",
]);

const CONTINUOUS_UNITS = new Set([
  "liters",
  "liter",
  "l",
  "ml",
  "milliliters",
  "milliliter",
  "kg",
  "kilograms",
  "kilogram",
  "g",
  "grams",
  "gram",
  "oz",
  "ounce",
  "ounces",
  "gallons",
  "gallon",
  "gal",
  "cc",
  "fl oz",
]);

/**
 * Format a numeric quantity for display.
 *
 * @param {number|string|null|undefined} value - The raw value from the API.
 * @param {string} [unit=""] - The unit string (e.g. "bottles", "kg").
 * @returns {string} Formatted number string, or "—" if value is not numeric.
 */
export function formatDisplayQuantity(value, unit = "") {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";

  const normalizedUnit = (unit || "").trim().toLowerCase();
  const isContinuous = CONTINUOUS_UNITS.has(normalizedUnit);

  if (isContinuous) {
    // 1 decimal max — drop trailing ".0" so "2.0" becomes "2"
    const fixed = num.toFixed(1);
    const parsed = parseFloat(fixed);
    return parsed % 1 === 0
      ? parsed.toLocaleString("en-PH")
      : parsed.toLocaleString("en-PH", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
  }

  // Discrete or unknown → whole number
  return Math.round(num).toLocaleString("en-PH");
}

/**
 * Format a numeric quantity and append its unit string.
 *
 * @param {number|string|null|undefined} value
 * @param {string} [unit=""]
 * @returns {string} e.g. "613 bottles" or "2.5 liters" or "— units"
 */
export function formatWithUnit(value, unit = "") {
  const formatted = formatDisplayQuantity(value, unit);
  if (!unit) return formatted;
  return `${formatted} ${unit}`;
}
