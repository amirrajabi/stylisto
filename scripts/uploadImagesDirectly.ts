import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywbbsdqdkucrvyowukcs.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3YmJzZHFka3VjcnZ5b3d1a2NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkwMzQ5MiwiZXhwIjoyMDQ5NDc5NDkyfQ.fEWFOB_kS7i9FH8m2Sw31eoFEp2EvYKSgKgzF8D9V5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  image_url: string;
}

async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.arrayBuffer();
}

async function uploadToStorage(
  buffer: ArrayBuffer,
  filename: string
): Promise<string | null> {
  try {
    console.log(`📤 Uploading ${filename} to Storage...`);

    const { data, error } = await supabase.storage
      .from('wardrobe-images')
      .upload(`items/${filename}`, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`❌ Upload error for ${filename}:`, error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('wardrobe-images')
      .getPublicUrl(`items/${filename}`);

    console.log(`✅ Uploaded ${filename} successfully!`);
    return publicUrl;
  } catch (error) {
    console.error(`💥 Exception uploading ${filename}:`, error);
    return null;
  }
}

async function updateItemImageUrl(
  itemId: string,
  newImageUrl: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('clothing_items')
      .update({ image_url: newImageUrl })
      .eq('id', itemId);

    if (error) {
      console.error(`❌ Database update error for ${itemId}:`, error);
      return false;
    }

    console.log(`✅ Updated database for item ${itemId}`);
    return true;
  } catch (error) {
    console.error(`💥 Exception updating database for ${itemId}:`, error);
    return false;
  }
}

async function processItems() {
  console.log('🚀 Starting direct image upload process...');

  // Get all items
  const { data: items, error } = await supabase
    .from('clothing_items')
    .select('id, name, category, subcategory, image_url')
    .eq('user_id', 'f65547d7-6b51-4606-8a15-f292f6453f34');

  if (error || !items) {
    console.error('❌ Failed to fetch items:', error);
    return;
  }

  console.log(`📋 Found ${items.length} items to process`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n[${i + 1}/${items.length}] Processing: ${item.name}`);

    try {
      // Generate filename
      const filename = `${item.category}_${item.subcategory}_${item.id}.jpg`;

      // Download image
      console.log(`📥 Downloading image from ${item.image_url}...`);
      const imageBuffer = await downloadImage(item.image_url);
      console.log(
        `✅ Downloaded ${Math.round(imageBuffer.byteLength / 1024)}KB`
      );

      // Upload to Supabase Storage
      const newImageUrl = await uploadToStorage(imageBuffer, filename);

      if (newImageUrl) {
        // Update database
        const dbUpdated = await updateItemImageUrl(item.id, newImageUrl);

        if (dbUpdated) {
          successCount++;
          console.log(`🎉 Successfully processed ${item.name}`);
        } else {
          failureCount++;
          console.log(`💔 Failed to update database for ${item.name}`);
        }
      } else {
        failureCount++;
        console.log(`💔 Failed to upload ${item.name}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      failureCount++;
      console.error(`💥 Failed to process ${item.name}:`, error);
    }
  }

  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`✅ Successfully processed: ${successCount} items`);
  console.log(`❌ Failed: ${failureCount} items`);
}

processItems().catch(console.error);
