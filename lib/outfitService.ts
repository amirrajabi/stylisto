import { store } from '../store/store';
import { addOutfit } from '../store/wardrobeSlice';
import { ClothingItem, Outfit } from '../types/wardrobe';
import { supabase } from './supabase';

export interface GeneratedOutfitRecord {
  id: string;
  name: string;
  userId: string;
  items: ClothingItem[];
  score: {
    total: number;
    color: number;
    style: number;
    season: number;
    occasion: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class OutfitService {
  private static readonly GENERATED_OUTFIT_TAG = 'ai-generated';
  private static readonly MANUAL_OUTFIT_TAG = 'manual';

  static async saveGeneratedOutfits(outfits: any[]): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const outfitsToSave = outfits.map((outfit, index) => ({
        user_id: user.id,
        name: `Generated Outfit ${index + 1}`,
        occasions: [],
        seasons: [],
        tags: [this.GENERATED_OUTFIT_TAG],
        source_type: 'ai_generated',
        is_favorite: false,
        notes: `AI-generated outfit with ${outfit.items?.length || 0} items. Score: ${Math.round(outfit.score.total * 100)}%`,
      }));

      const { data: savedOutfits, error: outfitError } = await supabase
        .from('saved_outfits')
        .insert(outfitsToSave)
        .select();

      if (outfitError) throw outfitError;

      const outfitItems = savedOutfits.flatMap((savedOutfit, outfitIndex) =>
        outfits[outfitIndex].items.map((item: ClothingItem) => ({
          outfit_id: savedOutfit.id,
          clothing_item_id: item.id,
        }))
      );

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      // Add to Redux store
      savedOutfits.forEach((savedOutfit, index) => {
        const originalOutfit = outfits[index];
        const outfitForRedux: Outfit = {
          id: savedOutfit.id,
          name: savedOutfit.name,
          items: originalOutfit.items,
          occasion: savedOutfit.occasions as any[],
          season: savedOutfit.seasons as any[],
          tags: savedOutfit.tags || [],
          isFavorite: savedOutfit.is_favorite || false,
          timesWorn: 0,
          lastWorn: undefined,
          notes: savedOutfit.notes || '',
          createdAt: savedOutfit.created_at || new Date().toISOString(),
          updatedAt: savedOutfit.updated_at || new Date().toISOString(),
        };

        store.dispatch(addOutfit(outfitForRedux));
      });

      console.log('✅ Generated outfits saved to database and Redux store');
    } catch (error) {
      console.error('❌ Error saving generated outfits:', error);
      throw error;
    }
  }

  static async saveManualOutfit(
    name: string,
    items: ClothingItem[],
    occasions: string[] = [],
    seasons: string[] = [],
    notes: string = '',
    onSaved?: (outfitId: string) => void
  ): Promise<string> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const outfitToSave = {
        user_id: user.id,
        name: name,
        occasions: occasions,
        seasons: seasons,
        tags: [this.MANUAL_OUTFIT_TAG],
        source_type: 'manual',
        is_favorite: false,
        notes: notes || `Manual outfit with ${items.length} items`,
      };

      const { data: savedOutfit, error: outfitError } = await supabase
        .from('saved_outfits')
        .insert([outfitToSave])
        .select()
        .single();

      if (outfitError) throw outfitError;

      const outfitItems = items.map((item: ClothingItem) => ({
        outfit_id: savedOutfit.id,
        clothing_item_id: item.id,
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      // Create Outfit object for Redux store
      const outfitForRedux: Outfit = {
        id: savedOutfit.id,
        name: savedOutfit.name,
        items: items,
        occasion: occasions as any[],
        season: seasons as any[],
        tags: savedOutfit.tags || [],
        isFavorite: savedOutfit.is_favorite || false,
        timesWorn: 0,
        lastWorn: undefined,
        notes: savedOutfit.notes || '',
        createdAt: savedOutfit.created_at || new Date().toISOString(),
        updatedAt: savedOutfit.updated_at || new Date().toISOString(),
      };

      // Add to Redux store
      store.dispatch(addOutfit(outfitForRedux));

      console.log(
        '✅ Manual outfit saved to database and Redux store:',
        savedOutfit.id
      );
      if (onSaved) {
        onSaved(savedOutfit.id);
      }
      return savedOutfit.id;
    } catch (error) {
      console.error('❌ Error saving manual outfit:', error);
      throw error;
    }
  }

  static async loadGeneratedOutfits(): Promise<GeneratedOutfitRecord[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return [];
      }

      console.log('🔍 Loading generated outfits for user:', user.id);

      const { data: outfits, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          tags,
          notes,
          created_at,
          updated_at,
          outfit_items (
            clothing_items (
              id,
              name,
              category,
              color,
              brand,
              image_url,
              seasons,
              occasions,
              size,
              subcategory,
              tags,
              price,
              purchase_date,
              last_worn,
              times_worn,
              is_favorite,
              notes
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading outfits:', error);
        throw error;
      }

      console.log(
        '✅ Found',
        outfits?.length || 0,
        'generated outfits for user'
      );

      return outfits.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        userId: user.id,
        items: outfit.outfit_items
          .map(oi => oi.clothing_items)
          .filter(Boolean)
          .flat()
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
            brand: item.brand,
            size: item.size,
            season: item.seasons || [],
            occasion: item.occasions || [],
            imageUrl: item.image_url,
            tags: item.tags || [],
            isFavorite: item.is_favorite || false,
            lastWorn: item.last_worn,
            timesWorn: item.times_worn || 0,
            purchaseDate: item.purchase_date,
            price: item.price,
            notes: item.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        score: this.extractScoreFromNotes(outfit.notes),
        tags: outfit.tags,
        createdAt: outfit.created_at,
        updatedAt: outfit.updated_at,
      }));
    } catch (error) {
      console.error('❌ Error loading generated outfits:', error);
      return [];
    }
  }

  static async loadManualOutfits(): Promise<GeneratedOutfitRecord[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        return [];
      }

      console.log('🔍 Loading manual outfits for user:', user.id);

      const { data: outfits, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          tags,
          notes,
          occasions,
          seasons,
          created_at,
          updated_at,
          outfit_items (
            clothing_items (
              id,
              name,
              category,
              color,
              brand,
              image_url,
              seasons,
              occasions,
              size,
              subcategory,
              tags,
              price,
              purchase_date,
              last_worn,
              times_worn,
              is_favorite,
              notes
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('source_type', 'manual')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading manual outfits:', error);
        throw error;
      }

      console.log('✅ Found', outfits?.length || 0, 'manual outfits for user');

      return outfits.map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        userId: user.id,
        items: outfit.outfit_items
          .map(oi => oi.clothing_items)
          .filter(Boolean)
          .flat()
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
            brand: item.brand,
            size: item.size,
            season: item.seasons || [],
            occasion: item.occasions || [],
            imageUrl: item.image_url,
            tags: item.tags || [],
            isFavorite: item.is_favorite || false,
            lastWorn: item.last_worn,
            timesWorn: item.times_worn || 0,
            purchaseDate: item.purchase_date,
            price: item.price,
            notes: item.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        score: {
          total: 1.0,
          color: 1.0,
          style: 1.0,
          season: 1.0,
          occasion: 1.0,
        },
        tags: outfit.tags,
        createdAt: outfit.created_at,
        updatedAt: outfit.updated_at,
      }));
    } catch (error) {
      console.error('❌ Error loading manual outfits:', error);
      return [];
    }
  }

  static async clearGeneratedOutfits(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found for clearing outfits');
        throw new Error('User not authenticated');
      }

      console.log('🧹 Clearing generated outfits for user:', user.id);

      const { error } = await supabase
        .from('saved_outfits')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated')
        .is('deleted_at', null);

      if (error) {
        console.error('❌ Database error clearing outfits:', error);
        throw error;
      }

      console.log('✅ Generated outfits cleared from database');
    } catch (error) {
      console.error('❌ Error clearing generated outfits:', error);
      throw error;
    }
  }

  static async hasGeneratedOutfits(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(
          '❌ No authenticated user found for hasGeneratedOutfits check'
        );
        return false;
      }

      console.log(
        '🔍 Checking for existing generated outfits for user:',
        user.id
      );

      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated')
        .is('deleted_at', null)
        .limit(1);

      if (error) {
        console.error('❌ Error checking for generated outfits:', error);
        throw error;
      }

      const hasOutfits = data.length > 0;
      console.log('✅ User has generated outfits:', hasOutfits);
      return hasOutfits;
    } catch (error) {
      console.error('❌ Error checking for generated outfits:', error);
      return false;
    }
  }

  static async hasManualOutfits(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(
          '❌ No authenticated user found for hasManualOutfits check'
        );
        return false;
      }

      console.log('🔍 Checking for existing manual outfits for user:', user.id);

      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'manual')
        .is('deleted_at', null)
        .limit(1);

      if (error) {
        console.error('❌ Error checking for manual outfits:', error);
        throw error;
      }

      const hasOutfits = data.length > 0;
      console.log('✅ User has manual outfits:', hasOutfits);
      return hasOutfits;
    } catch (error) {
      console.error('❌ Error checking for manual outfits:', error);
      return false;
    }
  }

  private static extractScoreFromNotes(notes: string | null): {
    total: number;
    color: number;
    style: number;
    season: number;
    occasion: number;
  } {
    if (!notes) {
      return { total: 0.8, color: 0.8, style: 0.8, season: 0.8, occasion: 0.8 };
    }

    const scoreMatch = notes.match(/Score: (\d+)%/);
    const totalScore = scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0.8;

    return {
      total: totalScore,
      color: totalScore * 0.9,
      style: totalScore * 0.95,
      season: totalScore * 0.85,
      occasion: totalScore * 0.9,
    };
  }
}
