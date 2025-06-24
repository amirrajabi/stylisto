/**
 * Color Theory Utilities
 * 
 * This module provides functions for working with colors, color harmonies,
 * and color theory principles for outfit generation.
 */

// Color harmony types
export const COLOR_HARMONY = {
  MONOCHROMATIC: 'monochromatic',
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  TRIADIC: 'triadic',
  SPLIT_COMPLEMENTARY: 'split_complementary',
  TETRADIC: 'tetradic',
  NEUTRAL: 'neutral',
};

// Color types for fashion
export const COLOR_TYPE = {
  NEUTRAL: 'neutral',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
};

// Common neutral colors in fashion
export const NEUTRAL_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
  '#A9A9A9', // Dark Gray
  '#D3D3D3', // Light Gray
  '#F5F5F5', // Off-White
  '#A52A2A', // Brown
  '#D2B48C', // Tan
  '#F5F5DC', // Beige
  '#708090', // Slate Gray
  '#000080', // Navy
];

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Default to black if invalid hex
  if (!hex || !hex.startsWith('#')) {
    return { h: 0, s: 0, l: 0 };
  }
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return {
    h: h * 360,
    s,
    l,
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get complementary color
 */
export function getComplementaryColor(hex: string): string {
  const hsl = hexToHSL(hex);
  const complementaryHue = (hsl.h + 180) % 360;
  return hslToHex(complementaryHue, hsl.s, hsl.l);
}

/**
 * Get analogous colors
 */
export function getAnalogousColors(hex: string, count: number = 3, angle: number = 30): string[] {
  const hsl = hexToHSL(hex);
  const colors: string[] = [hex];
  
  const baseHue = hsl.h;
  const step = angle;
  
  for (let i = 1; i < count; i++) {
    if (i % 2 === 1) {
      // Add colors clockwise
      const newHue = (baseHue + step * Math.ceil(i / 2)) % 360;
      colors.push(hslToHex(newHue, hsl.s, hsl.l));
    } else {
      // Add colors counter-clockwise
      const newHue = (baseHue - step * (i / 2)) % 360;
      colors.push(hslToHex(newHue < 0 ? newHue + 360 : newHue, hsl.s, hsl.l));
    }
  }
  
  return colors;
}

/**
 * Get triadic colors
 */
export function getTriadicColors(hex: string): string[] {
  const hsl = hexToHSL(hex);
  const triad1 = (hsl.h + 120) % 360;
  const triad2 = (hsl.h + 240) % 360;
  
  return [
    hex,
    hslToHex(triad1, hsl.s, hsl.l),
    hslToHex(triad2, hsl.s, hsl.l),
  ];
}

/**
 * Get split complementary colors
 */
export function getSplitComplementaryColors(hex: string): string[] {
  const hsl = hexToHSL(hex);
  const complement = (hsl.h + 180) % 360;
  const split1 = (complement - 30) % 360;
  const split2 = (complement + 30) % 360;
  
  return [
    hex,
    hslToHex(split1 < 0 ? split1 + 360 : split1, hsl.s, hsl.l),
    hslToHex(split2, hsl.s, hsl.l),
  ];
}

/**
 * Get monochromatic colors
 */
export function getMonochromaticColors(hex: string, count: number = 5): string[] {
  const hsl = hexToHSL(hex);
  const colors: string[] = [];
  
  // Keep hue constant, vary saturation and lightness
  for (let i = 0; i < count; i++) {
    const newS = Math.max(0, Math.min(1, hsl.s - 0.3 + (i / (count - 1)) * 0.6));
    const newL = Math.max(0.1, Math.min(0.9, hsl.l - 0.3 + (i / (count - 1)) * 0.6));
    
    colors.push(hslToHex(hsl.h, newS, newL));
  }
  
  return colors;
}

/**
 * Check if a color is neutral
 */
export function isNeutralColor(hex: string): boolean {
  // Check if color is in neutral list
  if (NEUTRAL_COLORS.some(neutral => areColorsClose(hex, neutral))) {
    return true;
  }
  
  // Check if color has low saturation
  const hsl = hexToHSL(hex);
  return hsl.s < 0.15;
}

/**
 * Check if two colors are visually close
 */
export function areColorsClose(color1: string, color2: string): boolean {
  const hsl1 = hexToHSL(color1);
  const hsl2 = hexToHSL(color2);
  
  // Calculate distance between colors
  const hueDiff = Math.min(
    Math.abs(hsl1.h - hsl2.h),
    360 - Math.abs(hsl1.h - hsl2.h)
  );
  const satDiff = Math.abs(hsl1.s - hsl2.s);
  const lightDiff = Math.abs(hsl1.l - hsl2.l);
  
  // Colors are close if all components are within thresholds
  return hueDiff < 30 && satDiff < 0.3 && lightDiff < 0.3;
}

/**
 * Determine color harmony type from a set of colors
 */
export function determineColorHarmony(colors: string[]): string {
  if (colors.length <= 1) return COLOR_HARMONY.MONOCHROMATIC;
  
  // Convert all colors to HSL
  const hslColors = colors.map(hexToHSL);
  
  // Check for neutral colors
  const neutralColors = hslColors.filter(color => color.s < 0.15);
  if (neutralColors.length === hslColors.length) {
    return COLOR_HARMONY.NEUTRAL;
  }
  
  // If most colors are neutral, focus on the non-neutral ones
  if (neutralColors.length >= hslColors.length - 1 && hslColors.length > 2) {
    const nonNeutrals = hslColors.filter(color => color.s >= 0.15);
    if (nonNeutrals.length > 0) {
      return determineColorHarmony(
        nonNeutrals.map((hsl, i) => hslToHex(hsl.h, hsl.s, hsl.l))
      );
    }
  }
  
  // Check for monochromatic (same hue, different saturation/lightness)
  const hues = hslColors.map(color => color.h);
  const hueRange = Math.max(...hues) - Math.min(...hues);
  if (hueRange <= 15 || hueRange >= 345) {
    return COLOR_HARMONY.MONOCHROMATIC;
  }
  
  // Check for analogous (adjacent on color wheel)
  if (hueRange <= 60 || hueRange >= 300) {
    return COLOR_HARMONY.ANALOGOUS;
  }
  
  // Check for complementary (opposite on color wheel)
  if (hslColors.length === 2) {
    const hueDiff = Math.abs(hues[0] - hues[1]);
    if (Math.abs(hueDiff - 180) <= 30) {
      return COLOR_HARMONY.COMPLEMENTARY;
    }
  }
  
  // Check for triadic (three colors evenly spaced)
  if (hslColors.length === 3) {
    const sortedHues = [...hues].sort((a, b) => a - b);
    const diff1 = sortedHues[1] - sortedHues[0];
    const diff2 = sortedHues[2] - sortedHues[1];
    if (Math.abs(diff1 - 120) <= 30 && Math.abs(diff2 - 120) <= 30) {
      return COLOR_HARMONY.TRIADIC;
    }
  }
  
  // Check for split complementary
  if (hslColors.length === 3) {
    const sortedHues = [...hues].sort((a, b) => a - b);
    const diff1 = sortedHues[1] - sortedHues[0];
    const diff2 = sortedHues[2] - sortedHues[1];
    if ((Math.abs(diff1 - 150) <= 30 && Math.abs(diff2 - 30) <= 30) ||
        (Math.abs(diff1 - 30) <= 30 && Math.abs(diff2 - 150) <= 30)) {
      return COLOR_HARMONY.SPLIT_COMPLEMENTARY;
    }
  }
  
  // Check for tetradic (four colors in rectangular arrangement)
  if (hslColors.length === 4) {
    const sortedHues = [...hues].sort((a, b) => a - b);
    const diff1 = sortedHues[1] - sortedHues[0];
    const diff2 = sortedHues[2] - sortedHues[1];
    const diff3 = sortedHues[3] - sortedHues[2];
    if (Math.abs(diff1 - diff3) <= 30 && Math.abs(diff2 - 180) <= 30) {
      return COLOR_HARMONY.TETRADIC;
    }
  }
  
  // Default: custom harmony
  return 'custom';
}

/**
 * Get a color palette based on a base color and harmony type
 */
export function getColorPalette(
  baseColor: string,
  harmonyType: string,
  count: number = 3
): string[] {
  switch (harmonyType) {
    case COLOR_HARMONY.MONOCHROMATIC:
      return getMonochromaticColors(baseColor, count);
    case COLOR_HARMONY.ANALOGOUS:
      return getAnalogousColors(baseColor, count);
    case COLOR_HARMONY.COMPLEMENTARY:
      return [baseColor, getComplementaryColor(baseColor)];
    case COLOR_HARMONY.TRIADIC:
      return getTriadicColors(baseColor);
    case COLOR_HARMONY.SPLIT_COMPLEMENTARY:
      return getSplitComplementaryColors(baseColor);
    default:
      // For custom or unspecified harmony, return analogous as default
      return getAnalogousColors(baseColor, count);
  }
}

/**
 * Calculate contrast ratio between two colors
 * (useful for text/background combinations)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const rgb1 = hexToRGB(color1);
  const rgb2 = hexToRGB(color2);
  
  // Calculate relative luminance
  const luminance1 = calculateRelativeLuminance(rgb1);
  const luminance2 = calculateRelativeLuminance(rgb2);
  
  // Calculate contrast ratio
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex to RGB
 */
function hexToRGB(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  return { r, g, b };
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function calculateRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  // Convert RGB to sRGB
  const sRGB = {
    r: rgb.r <= 0.03928 ? rgb.r / 12.92 : Math.pow((rgb.r + 0.055) / 1.055, 2.4),
    g: rgb.g <= 0.03928 ? rgb.g / 12.92 : Math.pow((rgb.g + 0.055) / 1.055, 2.4),
    b: rgb.b <= 0.03928 ? rgb.b / 12.92 : Math.pow((rgb.b + 0.055) / 1.055, 2.4),
  };
  
  // Calculate luminance
  return 0.2126 * sRGB.r + 0.7152 * sRGB.g + 0.0722 * sRGB.b;
}