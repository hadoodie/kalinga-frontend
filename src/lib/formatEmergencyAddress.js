const SHORTEN_MAP = [
  [/\bUniversity\b/gi, "Univ."],
  [/\bBoulevard\b/gi, "Blvd."],
  [/\bAvenue\b/gi, "Ave."],
  [/\bStreet\b/gi, "St."],
  [/\bDrive\b/gi, "Dr."],
  [/\bBuilding\b/gi, "Bldg."],
  [/\bBarangay\b/gi, "Brgy."],
  [/\bNational\b/gi, "Nat'l"],
  [/\bHighway\b/gi, "Hwy."],
  [/\bRoad\b/gi, "Rd."],
];

export default function formatEmergencyAddress(raw) {
  if (!raw) return "";
  const cleanedParts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter(
      (part) =>
        !/^(philippines|metro manila|ncr)$/i.test(part) &&
        !/^\d{4}$/i.test(part) &&
        !/\bdistrict\b/i.test(part),
    )
    .map((part) => {
      let nextPart = part;

      for (const [pattern, replacement] of SHORTEN_MAP) {
        nextPart = nextPart.replace(pattern, replacement);
      }

      return nextPart;
    });

  return cleanedParts.slice(0, 4).join(", ");
}
