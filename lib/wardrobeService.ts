import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { ClothingItem } from '../types/wardrobe';
import { storageService } from './storage';
import { supabase } from './supabase';

export interface CreateClothingItemData {
  name: string;
  category: string;
  subcategory?: string;
  color: string;
  brand?: string;
  size?: string;
  seasons: string[];
  occasions: string[];
  imageUri: string;
  tags: string[];
  notes?: string;
  price?: number;
  purchaseDate?: string;
}

export interface UpdateClothingItemData
  extends Partial<CreateClothingItemData> {
  id: string;
}

class WardrobeService {
  private static instance: WardrobeService;

  constructor() {
    // Remove the storage service initialization since we're using the singleton
  }

  static getInstance(): WardrobeService {
    if (!WardrobeService.instance) {
      WardrobeService.instance = new WardrobeService();
    }
    return WardrobeService.instance;
  }

  async createClothingItem(
    itemData: CreateClothingItemData
  ): Promise<{ data: ClothingItem | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      console.log('Creating item for user:', user.id);

      // Ensure user profile exists using upsert
      console.log('Ensuring user profile exists...');

      const { error: upsertError } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

      if (upsertError) {
        console.error('Failed to ensure user profile:', upsertError);
        return {
          data: null,
          error: `Failed to create user profile: ${upsertError.message}`,
        };
      }

      const itemId = uuidv4();

      const uploadResult = await storageService.uploadImage(
        itemData.imageUri,
        user.id,
        'clothing',
        itemId
      );

      if (uploadResult.error || !uploadResult.data) {
        return {
          data: null,
          error: uploadResult.error?.message || 'Failed to upload image',
        };
      }

      const imageUrl = storageService.getOptimizedImageUrl(
        uploadResult.data.path,
        'medium'
      );

      const clothingItemPayload = {
        id: itemId,
        user_id: user.id,
        name: itemData.name,
        category: itemData.category,
        subcategory: itemData.subcategory || null,
        color: itemData.color,
        brand: itemData.brand || null,
        size: itemData.size || null,
        seasons: itemData.seasons,
        occasions: itemData.occasions,
        image_url: imageUrl,
        tags: itemData.tags,
        notes: itemData.notes || null,
        price: itemData.price || null,
        purchase_date: itemData.purchaseDate || null,
        is_favorite: false,
        times_worn: 0,
        last_worn: null,
      };

      console.log('Inserting clothing item with payload:', {
        ...clothingItemPayload,
        image_url: 'redacted', // Don't log the full URL
      });

      const { data, error } = await supabase
        .from('clothing_items')
        .insert(clothingItemPayload)
        .select()
        .single();

      if (error) {
        console.error('Insert error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        await storageService.deleteImage(uploadResult.data.path);

        // Provide more specific error messages
        if (error.message.includes('foreign key')) {
          return {
            data: null,
            error: 'User profile error. Please try logging out and back in.',
          };
        }

        return { data: null, error: error.message };
      }

      const clothingItem: ClothingItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || '',
        color: data.color,
        brand: data.brand || '',
        size: data.size || '',
        season: data.seasons || [],
        occasion: data.occasions || [],
        imageUrl: data.image_url,
        tags: data.tags || [],
        isFavorite: data.is_favorite,
        lastWorn: data.last_worn
          ? new Date(data.last_worn).toISOString()
          : undefined,
        timesWorn: data.times_worn,
        purchaseDate: data.purchase_date
          ? new Date(data.purchase_date).toISOString()
          : undefined,
        price: data.price || undefined,
        notes: data.notes || '',
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString(),
      };

      return { data: clothingItem, error: null };
    } catch (error) {
      console.error('Error creating clothing item:', error);
      return { data: null, error: (error as Error).message };
    }
  }

  async updateClothingItem(
    itemData: UpdateClothingItemData
  ): Promise<{ data: ClothingItem | null; error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      let imageUrl = undefined;

      if (itemData.imageUri) {
        const uploadResult = await storageService.uploadImage(
          itemData.imageUri,
          user.id,
          'clothing',
          itemData.id
        );

        if (uploadResult.error || !uploadResult.data) {
          return {
            data: null,
            error: uploadResult.error?.message || 'Failed to upload image',
          };
        }

        imageUrl = storageService.getOptimizedImageUrl(
          uploadResult.data.path,
          'medium'
        );
      }

      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };

      if (itemData.name) updatePayload.name = itemData.name;
      if (itemData.category) updatePayload.category = itemData.category;
      if (itemData.subcategory !== undefined)
        updatePayload.subcategory = itemData.subcategory;
      if (itemData.color) updatePayload.color = itemData.color;
      if (itemData.brand !== undefined) updatePayload.brand = itemData.brand;
      if (itemData.size !== undefined) updatePayload.size = itemData.size;
      if (itemData.seasons) updatePayload.seasons = itemData.seasons;
      if (itemData.occasions) updatePayload.occasions = itemData.occasions;
      if (imageUrl) updatePayload.image_url = imageUrl;
      if (itemData.tags) updatePayload.tags = itemData.tags;
      if (itemData.notes !== undefined) updatePayload.notes = itemData.notes;
      if (itemData.price !== undefined) updatePayload.price = itemData.price;
      if (itemData.purchaseDate !== undefined)
        updatePayload.purchase_date = itemData.purchaseDate;

      const { data, error } = await supabase
        .from('clothing_items')
        .update(updatePayload)
        .eq('id', itemData.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      const clothingItem: ClothingItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory || '',
        color: data.color,
        brand: data.brand || '',
        size: data.size || '',
        season: data.seasons || [],
        occasion: data.occasions || [],
        imageUrl: data.image_url,
        tags: data.tags || [],
        isFavorite: data.is_favorite,
        lastWorn: data.last_worn
          ? new Date(data.last_worn).toISOString()
          : undefined,
        timesWorn: data.times_worn,
        purchaseDate: data.purchase_date
          ? new Date(data.purchase_date).toISOString()
          : undefined,
        price: data.price || undefined,
        notes: data.notes || '',
        createdAt: new Date(data.created_at).toISOString(),
        updatedAt: new Date(data.updated_at).toISOString(),
      };

      return { data: clothingItem, error: null };
    } catch (error) {
      console.error('Error updating clothing item:', error);
      return { data: null, error: (error as Error).message };
    }
  }

  async getClothingItems(): Promise<{
    data: ClothingItem[] | null;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      const clothingItems: ClothingItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || '',
        color: item.color,
        brand: item.brand || '',
        size: item.size || '',
        season: item.seasons || [],
        occasion: item.occasions || [],
        imageUrl: item.image_url,
        tags: item.tags || [],
        isFavorite: item.is_favorite,
        lastWorn: item.last_worn
          ? new Date(item.last_worn).toISOString()
          : undefined,
        timesWorn: item.times_worn,
        purchaseDate: item.purchase_date
          ? new Date(item.purchase_date).toISOString()
          : undefined,
        price: item.price || undefined,
        notes: item.notes || '',
        createdAt: new Date(item.created_at).toISOString(),
        updatedAt: new Date(item.updated_at).toISOString(),
      }));

      return { data: clothingItems, error: null };
    } catch (error) {
      console.error('Error fetching clothing items:', error);
      return { data: null, error: (error as Error).message };
    }
  }

  async deleteClothingItem(itemId: string): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      console.log('Delete attempt - User ID:', user.id, 'Item ID:', itemId);

      // Use the database function to perform soft delete with proper RLS handling
      const { data: result, error: rpcError } = await supabase.rpc(
        'soft_delete_clothing_item',
        {
          item_id: itemId,
        }
      );

      if (rpcError) {
        console.error('Database function error:', rpcError);
        return { error: `Delete failed: ${rpcError.message}` };
      }

      if (!result || !result.success) {
        const errorMessage = result?.error || 'Unknown error occurred';
        console.error('Delete operation failed:', errorMessage);
        return { error: errorMessage };
      }

      console.log('Soft delete successful:', result.message);
      return { error: null };
    } catch (error) {
      console.error('Error deleting clothing item:', error);
      return { error: (error as Error).message };
    }
  }

  async toggleFavorite(itemId: string): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data: currentItem, error: fetchError } = await supabase
        .from('clothing_items')
        .select('is_favorite')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        return { error: fetchError.message };
      }

      const { error } = await supabase
        .from('clothing_items')
        .update({
          is_favorite: !currentItem.is_favorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { error: (error as Error).message };
    }
  }
}

export const wardrobeService = WardrobeService.getInstance();
