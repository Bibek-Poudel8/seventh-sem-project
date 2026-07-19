export const categoryColors: Record<string, string> = {
  "Income": "#22C55E",
  "Food & Dining": "#F59E0B",
  "Transportation": "#3B82F6",
  "Shopping & Retail": "#A855F7",
  "Utilities & Bills": "#EAB308",
  "Healthcare & Medical": "#EF4444",
  "Education": "#6366F1",
  "Entertainment & Recreation": "#EC4899",
  "Financial Services": "#14B8A6",
  "Government & Legal": "#475569",
  "Charity & Donations": "#10B981",
  "Miscellaneous": "#9CA3AF",
};

export function getCategoryColor(name?: string, dbColor?: string) {
  if (!name) return dbColor ?? "#9CA3AF";
  const key = Object.keys(categoryColors).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? categoryColors[key] : dbColor ?? "#9CA3AF";
}
