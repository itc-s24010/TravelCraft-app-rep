import type { Category } from "@/lib/api";

export const CATEGORY_FALLBACK_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#a855f7", "#ec4899", "#78716c", "#64748b",
];

interface CategoryBreakdownItem {
  categoryId: number;
}

function normalizedColor(color: string) {
  return color.trim().toLowerCase();
}

function generatedColor(index: number) {
  return `hsl(${(index * 47) % 360} 70% 55%)`;
}

/**
 * Resolves colors for display only. Unassigned colors are never persisted.
 * Saved category colors are reserved first so fallback colors cannot overlap them.
 */
export function resolveCategoryColors(
  breakdown: CategoryBreakdownItem[],
  categories: Category[] = [],
): Map<number, string> {
  const usedColors = new Set(
    categories
      .map((category) => category.color)
      .filter((color): color is string => Boolean(color?.trim()))
      .map(normalizedColor),
  );
  const resolved = new Map<number, string>();
  let generatedIndex = 0;

  for (const item of breakdown) {
    const category = categories.find((candidate) => candidate.categoryId === item.categoryId);
    const savedColor = category?.color?.trim();
    if (savedColor) {
      resolved.set(item.categoryId, savedColor);
      continue;
    }

    let color = CATEGORY_FALLBACK_COLORS.find(
      (candidate) => !usedColors.has(normalizedColor(candidate)),
    );
    while (!color || usedColors.has(normalizedColor(color))) {
      const candidate = generatedColor(generatedIndex++);
      if (!usedColors.has(normalizedColor(candidate))) color = candidate;
    }

    resolved.set(item.categoryId, color);
    usedColors.add(normalizedColor(color));
  }

  return resolved;
}