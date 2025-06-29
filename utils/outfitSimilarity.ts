import { ClothingItem } from '../types/wardrobe';

export interface SimilarityResult {
  similarity: number;
  isVerySimilar: boolean;
  breakdown: {
    itemMatch: number;
    colorMatch: number;
    categoryMatch: number;
    styleMatch: number;
  };
}

export class OutfitSimilarityDetector {
  private static readonly SIMILARITY_THRESHOLDS = {
    VERY_SIMILAR: 0.6,
    COLOR_CLOSE: 0.7,
    HUE_CLOSE: 30,
    SATURATION_CLOSE: 0.3,
    LIGHTNESS_CLOSE: 0.3,
  };

  static compareOutfits(
    outfit1: ClothingItem[],
    outfit2: ClothingItem[]
  ): SimilarityResult {
    if (outfit1.length === 0 || outfit2.length === 0) {
      return {
        similarity: 0,
        isVerySimilar: false,
        breakdown: {
          itemMatch: 0,
          colorMatch: 0,
          categoryMatch: 0,
          styleMatch: 0,
        },
      };
    }

    const itemMatch = this.calculateItemMatch(outfit1, outfit2);
    const colorMatch = this.calculateColorMatch(outfit1, outfit2);
    const categoryMatch = this.calculateCategoryMatch(outfit1, outfit2);
    const styleMatch = this.calculateStyleMatch(outfit1, outfit2);

    const similarity =
      itemMatch * 0.4 +
      colorMatch * 0.25 +
      categoryMatch * 0.2 +
      styleMatch * 0.15;

    return {
      similarity,
      isVerySimilar: similarity > this.SIMILARITY_THRESHOLDS.VERY_SIMILAR,
      breakdown: { itemMatch, colorMatch, categoryMatch, styleMatch },
    };
  }

  private static calculateItemMatch(
    outfit1: ClothingItem[],
    outfit2: ClothingItem[]
  ): number {
    const ids1 = new Set(outfit1.map(item => item.id));
    const ids2 = new Set(outfit2.map(item => item.id));

    const intersection = new Set([...ids1].filter(id => ids2.has(id)));
    const union = new Set([...ids1, ...ids2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private static calculateColorMatch(
    outfit1: ClothingItem[],
    outfit2: ClothingItem[]
  ): number {
    const colors1 = this.extractPrimaryColors(outfit1);
    const colors2 = this.extractPrimaryColors(outfit2);

    if (colors1.length === 0 || colors2.length === 0) return 0;

    let similarColorPairs = 0;
    let totalComparisons = 0;

    for (const color1 of colors1) {
      for (const color2 of colors2) {
        totalComparisons++;
        if (this.areColorsClose(color1, color2)) {
          similarColorPairs++;
        }
      }
    }

    return totalComparisons > 0 ? similarColorPairs / totalComparisons : 0;
  }

  private static calculateCategoryMatch(
    outfit1: ClothingItem[],
    outfit2: ClothingItem[]
  ): number {
    const categories1 = new Set(outfit1.map(item => item.category));
    const categories2 = new Set(outfit2.map(item => item.category));

    const intersection = new Set(
      [...categories1].filter(cat => categories2.has(cat))
    );
    const union = new Set([...categories1, ...categories2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private static calculateStyleMatch(
    outfit1: ClothingItem[],
    outfit2: ClothingItem[]
  ): number {
    const styles1 = this.extractStyles(outfit1);
    const styles2 = this.extractStyles(outfit2);

    if (styles1.length === 0 || styles2.length === 0) return 0;

    const styleSet1 = new Set(styles1);
    const styleSet2 = new Set(styles2);

    const intersection = new Set(
      [...styleSet1].filter(style => styleSet2.has(style))
    );
    const union = new Set([...styleSet1, ...styleSet2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private static extractPrimaryColors(outfit: ClothingItem[]): string[] {
    return outfit
      .map(item => item.color)
      .filter(color => color && color !== '#000000' && color !== '#ffffff');
  }

  private static extractStyles(outfit: ClothingItem[]): string[] {
    return outfit
      .flatMap(item => item.tags || [])
      .filter(tag =>
        [
          'casual',
          'formal',
          'business',
          'sporty',
          'vintage',
          'trendy',
          'classic',
          'bohemian',
        ].includes(tag.toLowerCase())
      );
  }

  private static areColorsClose(color1: string, color2: string): boolean {
    if (!color1 || !color2) return false;
    if (color1 === color2) return true;

    const hsl1 = this.hexToHSL(color1);
    const hsl2 = this.hexToHSL(color2);

    const hueDiff = Math.min(
      Math.abs(hsl1.h - hsl2.h),
      360 - Math.abs(hsl1.h - hsl2.h)
    );
    const satDiff = Math.abs(hsl1.s - hsl2.s);
    const lightDiff = Math.abs(hsl1.l - hsl2.l);

    return (
      hueDiff < this.SIMILARITY_THRESHOLDS.HUE_CLOSE &&
      satDiff < this.SIMILARITY_THRESHOLDS.SATURATION_CLOSE &&
      lightDiff < this.SIMILARITY_THRESHOLDS.LIGHTNESS_CLOSE
    );
  }

  private static hexToHSL(hex: string): { h: number; s: number; l: number } {
    if (!hex || !hex.startsWith('#')) {
      return { h: 0, s: 0, l: 0 };
    }

    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }

  static getOutfitFingerprint(outfit: ClothingItem[]): string {
    const categories = outfit.map(item => item.category).sort();
    const colors = outfit
      .map(item => item.color)
      .filter(Boolean)
      .sort();
    const styles = outfit.flatMap(item => item.tags || []).sort();

    return `${categories.join(',')}|${colors.join(',')}|${styles.join(',')}`;
  }

  static findSimilarOutfits(
    newOutfit: ClothingItem[],
    existingOutfits: { items: ClothingItem[]; id?: string; name?: string }[]
  ): { outfitIndex: number; similarity: SimilarityResult }[] {
    return existingOutfits
      .map((existingOutfit, index) => ({
        outfitIndex: index,
        similarity: this.compareOutfits(newOutfit, existingOutfit.items),
      }))
      .filter(result => result.similarity.isVerySimilar)
      .sort((a, b) => b.similarity.similarity - a.similarity.similarity);
  }
}
