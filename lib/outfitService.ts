import { store } from '../store/store';
import { addOutfit, updateOutfit } from '../store/wardrobeSlice';
import { ClothingItem, Outfit } from '../types/wardrobe';
import { generateOutfitName } from '../utils/outfitNaming';
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
    weather?: number;
    userPreference?: number;
    variety?: number;
  };
  isFavorite?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Simple event emitter for outfit favorite changes
class OutfitEventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

export const outfitFavoriteChanged = new OutfitEventEmitter();

export class OutfitService {
  private static readonly GENERATED_OUTFIT_TAG = 'ai-generated';
  private static readonly MANUAL_OUTFIT_TAG = 'manual';

  static async saveGeneratedOutfits(outfits: any[]): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get existing outfit names from database to prevent duplicates
      const { data: existingOutfits } = await supabase
        .from('saved_outfits')
        .select('name')
        .eq('user_id', user.id);

      const existingNames = existingOutfits?.map(outfit => outfit.name) || [];

      const outfitsToSave = outfits.map((outfit, index) => {
        // Generate unique name for each outfit
        const outfitName = generateOutfitName(outfit.items, [
          ...existingNames,
          // Also include names from outfits being saved in this batch
          ...outfits
            .slice(0, index)
            .map(o => generateOutfitName(o.items, existingNames)),
        ]);

        return {
          user_id: user.id,
          name: outfitName,
          occasions: [],
          seasons: [],
          tags: [this.GENERATED_OUTFIT_TAG],
          source_type: 'ai_generated',
          is_favorite: false,
          notes: `AI-generated outfit with ${outfit.items?.length || 0} items. Score: ${Math.round(outfit.score.total * 100)}%`,
        };
      });

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
    score?: {
      total: number;
      color: number;
      style: number;
      season: number;
      occasion: number;
      weather?: number;
      userPreference?: number;
      variety?: number;
    },
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

  static async saveSingleGeneratedOutfit(
    outfit: any,
    name?: string
  ): Promise<{ error: string | null; outfitId?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      let outfitName = name;

      // If no name provided, generate one while checking for duplicates
      if (!outfitName) {
        const { data: existingOutfits } = await supabase
          .from('saved_outfits')
          .select('name')
          .eq('user_id', user.id);

        const existingNames = existingOutfits?.map(outfit => outfit.name) || [];
        outfitName = generateOutfitName(outfit.items, existingNames);
      }

      const outfitToSave = {
        user_id: user.id,
        name: outfitName,
        occasions: [],
        seasons: [],
        tags: [this.GENERATED_OUTFIT_TAG],
        source_type: 'ai_generated',
        is_favorite: true, // Save as favorite when AI outfit is favorited
        notes: `AI-generated outfit with ${outfit.items?.length || 0} items. Score: ${Math.round(outfit.score.total * 100)}%`,
      };

      const { data: savedOutfit, error: outfitError } = await supabase
        .from('saved_outfits')
        .insert([outfitToSave])
        .select()
        .single();

      if (outfitError) {
        return { error: outfitError.message };
      }

      const outfitItems = outfit.items.map((item: ClothingItem) => ({
        outfit_id: savedOutfit.id,
        clothing_item_id: item.id,
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) {
        return { error: itemsError.message };
      }

      // Create Outfit object for Redux store
      const outfitForRedux: Outfit = {
        id: savedOutfit.id,
        name: savedOutfit.name,
        items: outfit.items,
        occasion: [],
        season: [],
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
        '✅ Single generated outfit saved to database and Redux store:',
        savedOutfit.id
      );

      return { error: null, outfitId: savedOutfit.id };
    } catch (error) {
      console.error('❌ Error saving single generated outfit:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
          occasions,
          seasons,
          is_favorite,
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
        score: {
          total: this.extractScoreFromNotes(outfit.notes).total,
          color: this.extractScoreFromNotes(outfit.notes).color,
          style: this.extractScoreFromNotes(outfit.notes).style,
          season: this.extractScoreFromNotes(outfit.notes).season,
          occasion: this.extractScoreFromNotes(outfit.notes).occasion,
          weather: undefined,
          userPreference: undefined,
          variety: undefined,
        },
        isFavorite: outfit.is_favorite || false,
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
        console.log(
          '❌ No authenticated user found for loading manual outfits'
        );
        return [];
      }

      console.log('📥 Loading non-favorited manual outfits for user:', user.id);

      const { data, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          user_id,
          created_at,
          updated_at,
          occasions,
          seasons,
          tags,
          is_favorite,
          notes,
          source_type,
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
              notes,
              description_with_ai
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('source_type', 'manual')
        .eq('is_favorite', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading manual outfits:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📝 No non-favorited manual outfits found for user');
        return [];
      }

      const outfits: GeneratedOutfitRecord[] = data.map(outfit => {
        const items = outfit.outfit_items
          .map(oi => oi.clothing_items)
          .filter(Boolean)
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
            description_with_ai: item.description_with_ai || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

        return {
          id: outfit.id,
          name: outfit.name,
          userId: outfit.user_id,
          items,
          score: this.extractScoreFromNotes(outfit.notes),
          isFavorite: outfit.is_favorite || false,
          tags: outfit.tags || [],
          createdAt: outfit.created_at || new Date().toISOString(),
          updatedAt: outfit.updated_at || new Date().toISOString(),
        };
      });

      console.log(`✅ Loaded ${outfits.length} manual outfits from database`);
      return outfits;
    } catch (error) {
      console.error('❌ Error loading manual outfits:', error);
      return [];
    }
  }

  static async loadAIGeneratedOutfits(): Promise<GeneratedOutfitRecord[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(
          '❌ No authenticated user found for loading AI-generated outfits'
        );
        return [];
      }

      console.log(
        '📥 Loading non-favorited AI-generated outfits for user:',
        user.id
      );

      const { data, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          user_id,
          created_at,
          updated_at,
          occasions,
          seasons,
          tags,
          is_favorite,
          notes,
          source_type,
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
              notes,
              description_with_ai
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated')
        .eq('is_favorite', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading AI-generated outfits:', error);
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📝 No non-favorited AI-generated outfits found for user');
        return [];
      }

      const outfits: GeneratedOutfitRecord[] = data.map(outfit => {
        const items = outfit.outfit_items
          .map(oi => oi.clothing_items)
          .filter(Boolean)
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
            description_with_ai: item.description_with_ai || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

        return {
          id: outfit.id,
          name: outfit.name,
          userId: outfit.user_id,
          items,
          score: this.extractScoreFromNotes(outfit.notes),
          isFavorite: outfit.is_favorite || false,
          tags: outfit.tags || [],
          createdAt: outfit.created_at || new Date().toISOString(),
          updatedAt: outfit.updated_at || new Date().toISOString(),
        };
      });

      console.log(
        `✅ Loaded ${outfits.length} non-favorited AI-generated outfits from database`
      );
      return outfits;
    } catch (error) {
      console.error('❌ Error loading AI-generated outfits:', error);
      return [];
    }
  }

  static async deleteOutfit(
    outfitId: string
  ): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      console.log('🗑️ Deleting outfit:', outfitId);

      // First check if outfit belongs to user
      const { data: outfit, error: fetchError } = await supabase
        .from('saved_outfits')
        .select('user_id, source_type')
        .eq('id', outfitId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching outfit:', fetchError);
        return { error: fetchError.message };
      }

      if (!outfit || outfit.user_id !== user.id) {
        return { error: 'Outfit not found or unauthorized' };
      }

      // Delete outfit (cascade delete will handle outfit_items)
      const { error: deleteError } = await supabase
        .from('saved_outfits')
        .delete()
        .eq('id', outfitId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('❌ Database error deleting outfit:', deleteError);
        return { error: deleteError.message };
      }

      console.log(
        `✅ Outfit ${outfitId} (${outfit.source_type}) deleted from database`
      );
      return { error: null };
    } catch (error) {
      console.error('❌ Error deleting outfit:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
        .delete()
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated');

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

      console.log(
        '🔍 Checking for existing non-favorited manual outfits for user:',
        user.id
      );

      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'manual')
        .eq('is_favorite', false)
        .limit(1);

      if (error) {
        console.error('❌ Error checking for manual outfits:', error);
        throw error;
      }

      const hasOutfits = data.length > 0;
      console.log('✅ User has non-favorited manual outfits:', hasOutfits);
      return hasOutfits;
    } catch (error) {
      console.error('❌ Error checking for manual outfits:', error);
      return false;
    }
  }

  static async hasAIGeneratedOutfits(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log(
          '❌ No authenticated user found for hasAIGeneratedOutfits check'
        );
        return false;
      }

      console.log(
        '🔍 Checking for existing non-favorited AI-generated outfits for user:',
        user.id
      );

      const { data, error } = await supabase
        .from('saved_outfits')
        .select('id')
        .eq('user_id', user.id)
        .eq('source_type', 'ai_generated')
        .eq('is_favorite', false)
        .limit(1);

      if (error) {
        console.error('❌ Error checking for AI-generated outfits:', error);
        throw error;
      }

      const hasOutfits = data.length > 0;
      console.log(
        '✅ User has non-favorited AI-generated outfits:',
        hasOutfits
      );
      return hasOutfits;
    } catch (error) {
      console.error('❌ Error checking for AI-generated outfits:', error);
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

  static async toggleOutfitFavorite(
    outfitId: string
  ): Promise<{ error: string | null; isFavorite?: boolean }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data: outfit, error: fetchError } = await supabase
        .from('saved_outfits')
        .select('is_favorite, source_type')
        .eq('id', outfitId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching outfit:', fetchError);
        return { error: 'Failed to fetch outfit' };
      }

      const newFavoriteStatus = !outfit.is_favorite;

      // Update favorite status for both manual and AI-generated outfits
      const { error: updateError } = await supabase
        .from('saved_outfits')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', outfitId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating outfit favorite status:', updateError);
        return { error: 'Failed to update favorite status' };
      }

      console.log(
        `✅ Outfit ${outfitId} (${outfit.source_type}) favorite status updated to: ${newFavoriteStatus}`
      );

      // Emit event for favorite changes
      outfitFavoriteChanged.emit();

      return { error: null, isFavorite: newFavoriteStatus };
    } catch (error) {
      console.error('Error toggling outfit favorite:', error);
      return { error: 'Failed to toggle favorite status' };
    }
  }

  static async updateOutfit(
    outfitId: string,
    name: string,
    items: ClothingItem[],
    occasions: string[] = [],
    seasons: string[] = [],
    notes: string = ''
  ): Promise<string> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updatedOutfitData = {
        name: name,
        occasions: occasions,
        seasons: seasons,
        notes: notes || `Updated outfit with ${items.length} items`,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedOutfit, error: outfitError } = await supabase
        .from('saved_outfits')
        .update(updatedOutfitData)
        .eq('id', outfitId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (outfitError) throw outfitError;

      await supabase.from('outfit_items').delete().eq('outfit_id', outfitId);

      const outfitItems = items.map((item: ClothingItem) => ({
        outfit_id: outfitId,
        clothing_item_id: item.id,
      }));

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems);

      if (itemsError) throw itemsError;

      const outfitForRedux: Outfit = {
        id: updatedOutfit.id,
        name: updatedOutfit.name,
        items: items,
        occasion: occasions as any[],
        season: seasons as any[],
        tags: updatedOutfit.tags || [],
        isFavorite: updatedOutfit.is_favorite || false,
        timesWorn: 0,
        lastWorn: undefined,
        notes: updatedOutfit.notes || '',
        createdAt: updatedOutfit.created_at || new Date().toISOString(),
        updatedAt: updatedOutfit.updated_at || new Date().toISOString(),
      };

      store.dispatch(updateOutfit(outfitForRedux));

      console.log(
        '✅ Outfit updated in database and Redux store:',
        updatedOutfit.id
      );
      return updatedOutfit.id;
    } catch (error) {
      console.error('❌ Error updating outfit:', error);
      throw error;
    }
  }
}
