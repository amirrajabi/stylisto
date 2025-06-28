import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  ClothingItem,
  ItemCondition,
  SaleListingDetails,
} from '../types/wardrobe';
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
  // Selling-related fields
  originalPrice?: number;
  currentValue?: number;
  sellingPrice?: number;
  condition?: ItemCondition;
  isForSale?: boolean;
  saleListing?: SaleListingDetails;
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

  /**
   * Fix problematic render/image URLs to simple storage URLs
   */
  private fixImageUrl(imageUrl: string): string {
    if (!imageUrl) return imageUrl;

    // Convert render/image URLs to simple object URLs to avoid 400 errors
    if (imageUrl.includes('/render/image/')) {
      const fixedUrl = imageUrl.replace('/render/image/', '/object/');
      console.log('Fixed problematic URL:', {
        original: imageUrl.substring(0, 100) + '...',
        fixed: fixedUrl.substring(0, 100) + '...',
      });
      return fixedUrl;
    }

    return imageUrl;
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
        // Selling-related fields
        original_price: itemData.originalPrice || null,
        current_value: itemData.currentValue || null,
        selling_price: itemData.sellingPrice || null,
        condition: itemData.condition || 'good',
        is_for_sale: itemData.isForSale || false,
        sale_listing: itemData.saleListing || {},
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
        imageUrl: this.fixImageUrl(data.image_url),
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
        // Selling-related fields
        originalPrice: data.original_price || undefined,
        currentValue: data.current_value || undefined,
        sellingPrice: data.selling_price || undefined,
        condition: data.condition || undefined,
        isForSale: data.is_for_sale || false,
        saleListing: data.sale_listing || undefined,
        description_with_ai: data.description_with_ai || undefined,
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
      // Selling-related fields
      if (itemData.originalPrice !== undefined)
        updatePayload.original_price = itemData.originalPrice;
      if (itemData.currentValue !== undefined)
        updatePayload.current_value = itemData.currentValue;
      if (itemData.sellingPrice !== undefined)
        updatePayload.selling_price = itemData.sellingPrice;
      if (itemData.condition !== undefined)
        updatePayload.condition = itemData.condition;
      if (itemData.isForSale !== undefined)
        updatePayload.is_for_sale = itemData.isForSale;
      if (itemData.saleListing !== undefined)
        updatePayload.sale_listing = itemData.saleListing;

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
        imageUrl: this.fixImageUrl(data.image_url),
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
        // Selling-related fields
        originalPrice: data.original_price || undefined,
        currentValue: data.current_value || undefined,
        sellingPrice: data.selling_price || undefined,
        condition: data.condition || undefined,
        isForSale: data.is_for_sale || false,
        saleListing: data.sale_listing || undefined,
        description_with_ai: data.description_with_ai || undefined,
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
        imageUrl: this.fixImageUrl(item.image_url),
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
        // Selling-related fields
        originalPrice: item.original_price || undefined,
        currentValue: item.current_value || undefined,
        sellingPrice: item.selling_price || undefined,
        condition: item.condition || undefined,
        isForSale: item.is_for_sale || false,
        saleListing: item.sale_listing || undefined,
        description_with_ai: item.description_with_ai || undefined, // افزودن فیلد AI description
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

  async permanentlyDeleteClothingItem(
    itemId: string
  ): Promise<{ error: string | null }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      console.log(
        'Permanent delete attempt - User ID:',
        user.id,
        'Item ID:',
        itemId
      );

      // First, get the item to find the image path
      const { data: item, error: fetchError } = await supabase
        .from('clothing_items')
        .select('image_url')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching item for deletion:', fetchError);
        return { error: `Failed to fetch item: ${fetchError.message}` };
      }

      if (!item) {
        return {
          error: 'Item not found or you do not have permission to delete it',
        };
      }

      // Extract the storage path from the image URL
      let imagePath: string | null = null;
      if (item.image_url) {
        console.log('Original image URL:', item.image_url);

        // Use the storage service's extractPathFromUrl method for more reliable extraction
        imagePath = storageService.extractPathFromUrl(item.image_url);

        // If that doesn't work, try manual extraction with multiple URL patterns
        if (!imagePath) {
          // Try different URL patterns
          const patterns = [
            '/storage/v1/object/public/wardrobe-images/',
            '/storage/v1/render/image/public/wardrobe-images/',
            '/object/public/wardrobe-images/',
            '/render/image/public/wardrobe-images/',
          ];

          for (const pattern of patterns) {
            const urlParts = item.image_url.split(pattern);
            if (urlParts.length > 1) {
              imagePath = urlParts[1].split('?')[0]; // Remove any query parameters
              console.log(
                `Extracted path using pattern ${pattern}:`,
                imagePath
              );
              break;
            }
          }
        }

        console.log('Final extracted image path:', imagePath);
      }

      // Delete the database record first
      const { error: deleteError } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting item from database:', deleteError);
        return { error: `Failed to delete item: ${deleteError.message}` };
      }

      // Delete the image from storage if it exists
      if (imagePath) {
        console.log('Attempting to delete image from storage:', imagePath);

        // First, check if the file exists
        try {
          const { data: fileInfo, error: infoError } =
            await storageService.getFileInfo(imagePath);
          console.log('File info before deletion:', { fileInfo, infoError });
        } catch (infoException) {
          console.log('Could not get file info:', infoException);
        }

        try {
          // Try the main deletion method
          const { error: storageError } =
            await storageService.deleteImage(imagePath);

          if (storageError) {
            console.error('Storage deletion failed:', {
              path: imagePath,
              error: storageError.message,
              errorCode: storageError.name || 'Unknown',
            });

            // Try with explicit bucket parameter
            console.log('Trying deletion with explicit bucket parameter...');
            const { error: altError } = await storageService.deleteImage(
              imagePath,
              'wardrobe-images'
            );

            if (altError) {
              console.error(
                'Alternative deletion also failed:',
                altError.message
              );

              // Try using Supabase storage directly as last resort
              console.log('Trying direct Supabase storage deletion...');
              const { error: directError } = await supabase.storage
                .from('wardrobe-images')
                .remove([imagePath]);

              if (directError) {
                console.error(
                  'Direct deletion also failed:',
                  directError.message
                );
              } else {
                console.log('Successfully deleted image using direct method');
              }
            } else {
              console.log(
                'Successfully deleted image using alternative method'
              );
            }
          } else {
            console.log('Successfully deleted image from storage');
          }
        } catch (storageException) {
          console.error('Exception during image deletion:', storageException);
        }
      } else {
        console.warn(
          'No image path found to delete. Original URL:',
          item.image_url
        );
      }

      console.log('Permanent delete successful');
      return { error: null };
    } catch (error) {
      console.error('Error permanently deleting clothing item:', error);
      return { error: (error as Error).message };
    }
  }

  async getFavoriteItems(): Promise<{
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
        .eq('is_favorite', true)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      const items: ClothingItem[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || '',
        color: item.color,
        brand: item.brand || '',
        size: item.size || '',
        season: item.seasons || [],
        occasion: item.occasions || [],
        imageUrl: this.fixImageUrl(item.image_url),
        tags: item.tags || [],
        isFavorite: item.is_favorite || false,
        lastWorn: item.last_worn,
        timesWorn: item.times_worn || 0,
        purchaseDate: item.purchase_date,
        price: item.price,
        notes: item.notes || '',
        originalPrice: item.original_price,
        currentValue: item.current_value,
        sellingPrice: item.selling_price,
        condition: item.condition || 'good',
        isForSale: item.is_for_sale || false,
        saleListing: item.sale_listing || {},
        description_with_ai: item.description_with_ai || undefined, // افزودن فیلد AI description
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { data: items, error: null };
    } catch (error) {
      console.error('Error fetching favorite items:', error);
      return { data: null, error: (error as Error).message };
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

  async removeSampleItems(): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // First check if user has any items at all
      const { data: allItems, error: fetchError } = await supabase
        .from('clothing_items')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (fetchError) {
        console.error('Error checking user items:', fetchError);
        return { success: false, error: fetchError.message };
      }

      // If user has no items, no need to remove sample items
      if (!allItems || allItems.length === 0) {
        console.log('No items found for user, no sample items to remove');
        return { success: true };
      }

      const sampleItemNames = [
        'Navy Blue T-Shirt',
        'Black Denim Jeans',
        'White Sneakers',
      ];

      const sampleBrands = ['Uniqlo', "Levi's", 'Adidas'];

      const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('user_id', user.id)
        .or(
          `name.in.(${sampleItemNames.map(name => `"${name}"`).join(',')}),brand.in.(${sampleBrands.map(brand => `"${brand}"`).join(',')})`
        );

      if (error) {
        console.error('Error removing sample items:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing sample items:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async debugImagePaths(userId?: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        console.log('No user ID provided for debugging');
        return;
      }

      console.log('=== DEBUG: Image Paths Analysis ===');

      // Get all clothing items with their image URLs
      const { data: items, error } = await supabase
        .from('clothing_items')
        .select('id, name, image_url')
        .eq('user_id', targetUserId)
        .is('deleted_at', null)
        .limit(5);

      if (error) {
        console.error('Error fetching items for debugging:', error);
        return;
      }

      if (!items || items.length === 0) {
        console.log('No items found for debugging');
        return;
      }

      for (const item of items) {
        console.log(`\n--- Item: ${item.name} (${item.id}) ---`);
        console.log('Original URL:', item.image_url);

        if (item.image_url) {
          // Test path extraction
          const extractedPath = storageService.extractPathFromUrl(
            item.image_url
          );
          console.log('Extracted path:', extractedPath);

          // Test manual extraction patterns
          const patterns = [
            '/storage/v1/object/public/wardrobe-images/',
            '/storage/v1/render/image/public/wardrobe-images/',
            '/object/public/wardrobe-images/',
            '/render/image/public/wardrobe-images/',
          ];

          for (const pattern of patterns) {
            const urlParts = item.image_url.split(pattern);
            if (urlParts.length > 1) {
              const manualPath = urlParts[1].split('?')[0];
              console.log(`  Pattern ${pattern} -> ${manualPath}`);
            }
          }

          // Test if file exists in storage
          if (extractedPath) {
            try {
              const { data: fileInfo, error: fileError } =
                await storageService.getFileInfo(extractedPath);
              console.log('File exists check:', {
                exists: !fileError,
                fileInfo,
                error: fileError?.message,
              });
            } catch (e) {
              console.log('File exists check failed:', e);
            }
          }
        }
      }

      console.log('=== END DEBUG ===\n');
    } catch (error) {
      console.error('Debug method error:', error);
    }
  }
}

export const wardrobeService = WardrobeService.getInstance();
