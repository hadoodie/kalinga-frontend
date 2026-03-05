/**
 * Smart Number Formatting for Logistics Display
 *
 * Rules:
 * - Continuous units (liters, kg, ml, etc.) → 1 decimal place
 * - Discrete units (bottles, vials, packs, days, etc.) → whole numbers
 * - Null / undefined / NaN → "—"
 * - Thousand separators via toLocaleString("en-PH")
 *
 * NEVER mutate raw API data — these are display-only helpers.
 */

const CONTINUOUS_UNITS = new Set([
  "liters",
  "liter",
  "l",
  "ml",
  "milliliters",
  "kg",
  "kilograms",
  "g",
  "grams",
  "oz",
  "ounces",
  "gallons",
  "gallon",
  "cc",
  "mg",
  "milligrams",
  "mcg",
  "micrograms",
]);

/**
 * Format a numeric value for display based on its unit type.
 * @param {number|string|null} value - The raw numeric value
 * @param {string} [unit="units"] - The unit label (used to detect continuous vs discrete)
 * @returns {string} Formatted display string (e.g. "1,234" or "5.2" or "—")
 */
export function formatDisplayQuantity(value, unit = "units") {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";

  const isContinuous = CONTINUOUS_UNITS.has(String(unit).toLowerCase().trim());

  const formatted = isContinuous
    ? num.toLocaleString("en-PH", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    : Math.round(num).toLocaleString("en-PH");

  return formatted;
}

/**
 * Format a value AND append its unit label.
 * @param {number|string|null} value
 * @param {string} [unit="units"]
 * @returns {string} e.g. "1,234 bottles" or "5.2 liters" or "—"
 */
export function formatWithUnit(value, unit = "units") {
  const formatted = formatDisplayQuantity(value, unit);
  if (formatted === "—") return "—";
  return `${formatted} ${unit}`;
}
