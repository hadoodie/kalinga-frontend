export const formatRelativeTime = (input, { short = false } = {}) => {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absDiff = Math.abs(diffSec);

  const units = [
    { label: "year", short: "y", seconds: 60 * 60 * 24 * 365 },
    { label: "month", short: "mo", seconds: 60 * 60 * 24 * 30 },
    { label: "day", short: "d", seconds: 60 * 60 * 24 },
    { label: "hour", short: "h", seconds: 60 * 60 },
    { label: "minute", short: "m", seconds: 60 },
  ];

  for (const unit of units) {
    if (absDiff >= unit.seconds) {
      const value = Math.round(absDiff / unit.seconds);
      if (short) {
        return `${value}${unit.short} ago`;
      }
      return `${value} ${unit.label}${value === 1 ? "" : "s"} ago`;
    }
  }

  return short ? "just now" : "moments ago";
};
