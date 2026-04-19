/**
 * Microsoft Word 2016 Font Size Stepping Logic
 * 
 * This module implements the exact font size stepping behavior from Word 2016:
 * - Non-linear font size steps (8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72)
 * - Relative stepping for mixed font sizes
 * - 1pt increment/decrement support
 */

// Word 2016 font size presets (in points)
export const WORD_FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

// Extended sizes for very large text
export const EXTENDED_FONT_SIZES = [
  ...WORD_FONT_SIZES,
  96, 120, 144, 192, 240, 288, 360, 432, 504, 576, 648, 720
];

/**
 * Get the next larger font size following Word 2016 stepping logic
 */
export function getNextLargerSize(currentSize: number): number {
  // If exact match in presets, return next preset
  const index = WORD_FONT_SIZES.indexOf(currentSize);
  if (index !== -1 && index < WORD_FONT_SIZES.length - 1) {
    return WORD_FONT_SIZES[index + 1];
  }

  // If larger than all presets, step by appropriate increments
  if (currentSize >= 72) {
    // Above 72, step by 12pt increments (Word behavior)
    return Math.min(currentSize + 12, 720);
  }

  // Find the next larger preset
  for (const size of WORD_FONT_SIZES) {
    if (size > currentSize) {
      return size;
    }
  }

  // Default fallback
  return Math.min(currentSize + 2, 720);
}

/**
 * Get the next smaller font size following Word 2016 stepping logic
 */
export function getNextSmallerSize(currentSize: number): number {
  // If exact match in presets, return previous preset
  const index = WORD_FONT_SIZES.indexOf(currentSize);
  if (index > 0) {
    return WORD_FONT_SIZES[index - 1];
  }

  // If larger than largest preset, step down by appropriate increments
  if (currentSize > 72) {
    const newSize = currentSize - 12;
    // Snap to 72 if we cross it
    if (newSize < 72 && currentSize > 72) {
      return 72;
    }
    return Math.max(newSize, 8);
  }

  // Find the previous smaller preset
  for (let i = WORD_FONT_SIZES.length - 1; i >= 0; i--) {
    if (WORD_FONT_SIZES[i] < currentSize) {
      return WORD_FONT_SIZES[i];
    }
  }

  // Minimum font size
  return 8;
}

/**
 * Increase font size by exactly 1pt (Ctrl+] behavior)
 */
export function increaseSizeBy1pt(currentSize: number): number {
  return Math.min(currentSize + 1, 720);
}

/**
 * Decrease font size by exactly 1pt (Ctrl+[ behavior)
 */
export function decreaseSizeBy1pt(currentSize: number): number {
  return Math.max(currentSize - 1, 1);
}

/**
 * Parse font size from CSS value (e.g., "12pt", "16px", "1.5em")
 * Returns the size in points
 */
export function parseFontSize(value: string | null | undefined): number {
  if (!value) return 12; // Default to 12pt

  const match = value.match(/^([\d.]+)(pt|px|em|rem)?$/i);
  if (!match) return 12;

  const num = parseFloat(match[1]);
  const unit = (match[2] || 'pt').toLowerCase();

  switch (unit) {
    case 'pt':
      return num;
    case 'px':
      return num * 0.75; // 1pt = 1.333px
    case 'em':
    case 'rem':
      return num * 12; // Assume 12pt base
    default:
      return num;
  }
}

/**
 * Format font size for display
 */
export function formatFontSize(size: number): string {
  // Round to 1 decimal if needed, otherwise whole number
  if (size === Math.round(size)) {
    return size.toString();
  }
  return size.toFixed(1);
}

/**
 * Check if a font size is in the Word preset list
 */
export function isPresetSize(size: number): boolean {
  return WORD_FONT_SIZES.includes(size);
}

/**
 * Get the closest preset size
 */
export function getClosestPresetSize(size: number): number {
  let closest = WORD_FONT_SIZES[0];
  let minDiff = Math.abs(size - closest);

  for (const preset of WORD_FONT_SIZES) {
    const diff = Math.abs(size - preset);
    if (diff < minDiff) {
      minDiff = diff;
      closest = preset;
    }
  }

  return closest;
}
