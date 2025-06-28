import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Virtual Try-On Storage Service
 * Simplified version for reliable storage operations
 */

export interface VirtualTryOnSaveResult {
  success: boolean;
  storageUrl?: string;
  databaseId?: string;
  error?: string;
}

/**
 * Save virtual try-on result with simplified approach
 */
export async function saveVirtualTryOnResult(
  generatedImageUrl: string,
  outfitName: string,
  options?: {
    outfitId?: string;
    userImageUrl?: string;
    processingTime?: number;
    confidence?: number;
    prompt?: string;
    styleInstructions?: string;
    itemsUsed?: string[];
  }
): Promise<VirtualTryOnSaveResult> {
  try {
    // Step 1: Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return {
        success: false,
        error: 'Authentication required. Please login.',
      };
    }

    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);

    // Step 2: Download generated image
    console.log('📥 Downloading generated image...');
    let imageData: ArrayBuffer;

    if (Platform.OS === 'web') {
      // Web: Use standard fetch and arrayBuffer
      const response = await fetch(generatedImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      imageData = await imageBlob.arrayBuffer();
    } else {
      // React Native: Download to temporary file and read as base64
      const timestamp = Date.now();
      const tempPath = `${FileSystem.documentDirectory}temp_virtual_tryon_${timestamp}.jpg`;

      console.log('📱 Downloading to temporary file...');
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUrl,
        tempPath
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }

      console.log('📖 Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(tempPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      imageData = decode(base64);

      // Clean up temporary file
      console.log('🧹 Cleaning up temporary file...');
      await FileSystem.deleteAsync(tempPath, { idempotent: true });
    }

    // Step 3: Create simple storage path
    const timestamp = Date.now();
    const fileName = `tryon_${timestamp}.jpg`;
    const storagePath = `${userId}/${fileName}`;

    console.log('📁 Storage path:', storagePath);

    // Step 4: Upload to storage
    console.log('☁️ Uploading to storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('virtual-try-on-results')
      .upload(storagePath, imageData, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`,
      };
    }

    console.log('✅ Upload successful');

    // Step 5: Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('virtual-try-on-results')
      .getPublicUrl(storagePath);

    // Step 6: Save to database (optional - don't fail if this fails)
    let databaseId: string | undefined;
    try {
      // Generate UUID for outfit if needed
      let outfitUuid = null;
      if (options?.outfitId) {
        // Check if it's already a UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(options.outfitId)) {
          outfitUuid = options.outfitId;
        }
      }

      const { data: dbData, error: dbError } = await supabase.rpc(
        'save_virtual_tryon_result',
        {
          p_outfit_id: outfitUuid,
          p_outfit_name: outfitName,
          p_user_image_url:
            options?.userImageUrl || 'https://via.placeholder.com/400x600',
          p_generated_image_url: publicUrl,
          p_storage_path: storagePath,
          p_processing_time_ms: options?.processingTime || 0,
          p_confidence_score: options?.confidence || 0.85,
          p_prompt_used: options?.prompt || `Virtual try-on for ${outfitName}`,
          p_style_instructions: options?.styleInstructions || 'natural fit',
          p_items_used: options?.itemsUsed || [],
        }
      );

      if (dbError) {
        console.warn('⚠️ Database save failed:', dbError.message);
        // Continue - we have the image in storage
      } else if (dbData?.success && dbData?.id) {
        databaseId = dbData.id;
        console.log('✅ Database save successful');
      }
    } catch (dbError) {
      console.warn('⚠️ Database operation failed:', dbError);
      // Continue - storage upload was successful
    }

    // Return success - image is available
    return {
      success: true,
      storageUrl: publicUrl,
      databaseId,
    };
  } catch (error) {
    console.error('💥 Virtual try-on save failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Test storage upload directly
 */
export async function testStorageUpload(): Promise<VirtualTryOnSaveResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const testData = new TextEncoder().encode('Test virtual try-on upload');
    const testPath = `${session.user.id}/test_${Date.now()}.txt`;

    const { error } = await supabase.storage
      .from('virtual-try-on-results')
      .upload(testPath, testData);

    if (error) {
      return { success: false, error: error.message };
    }

    // Clean up
    await supabase.storage.from('virtual-try-on-results').remove([testPath]);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    };
  }
}
