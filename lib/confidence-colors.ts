export const confidenceColors: Record<string, string> = {
  high: "#22C55E",   // Green
  medium: "#F59E0B", // Amber
  low: "#EF4444",    // Red
};

export const INACTIVE_CONFIDENCE_COLOR = "#CBD5E1"; // neutral gray for inactive/unfilled stars

export function getConfidenceColor(level?: string) {
  if (!level) return INACTIVE_CONFIDENCE_COLOR;
  const key = String(level).toLowerCase();
  return confidenceColors[key] ?? INACTIVE_CONFIDENCE_COLOR;
}

export default confidenceColors;
