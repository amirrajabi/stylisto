const { createClient } = require('@supabase/supabase-js');
const { Buffer } = require('buffer');

// Supabase configuration
const supabaseUrl = 'https://ywbbsdqdkucrvyowukcs.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3YmJzZHFka3VjcnZ5b3d1a2NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkwMzQ5MiwiZXhwIjoyMDQ5NDc5NDkyfQ.fEWFOB_kS7i9FH8m2Sw31eoFEp2EvYKSgKgzF8D9V5Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Specific high-quality URLs for each item
const SPECIFIC_IMAGE_URLS = {
  // TOPS
  'Black Silk Camisole':
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1200&h=1600&fit=crop&q=85',
  'Black Turtleneck':
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1200&h=1600&fit=crop&q=85',
  'Classic White Button-Down Shirt':
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1200&h=1600&fit=crop&q=85',
  'Cream Silk Blouse':
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1200&h=1600&fit=crop&q=85',
  'Floral Print Blouse':
    'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=1200&h=1600&fit=crop&q=85',
  'Navy Blue Cashmere Sweater':
    'https://images.unsplash.com/photo-1556821840-3a9fbc86ea14?w=1200&h=1600&fit=crop&q=85',
  'Oversized White Cotton T-Shirt':
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=1600&fit=crop&q=85',
  'Striped Long-Sleeve Tee':
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1200&h=1600&fit=crop&q=85',

  // BOTTOMS
  'Beige Linen Pants':
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=1200&h=1600&fit=crop&q=85',
  'Black Leather Mini Skirt':
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=1200&h=1600&fit=crop&q=85',
  'Black Tailored Trousers':
    'https://images.unsplash.com/photo-1506629905607-45c24a02b7c0?w=1200&h=1600&fit=crop&q=85',
  'High-Waist Dark Wash Jeans':
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=1200&h=1600&fit=crop&q=85',
  'Navy Pencil Skirt':
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=1200&h=1600&fit=crop&q=85',
  'Pleated Midi Skirt':
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=1200&h=1600&fit=crop&q=85',
  'White Wide-Leg Jeans':
    'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=1200&h=1600&fit=crop&q=85',

  // DRESSES
  'Emerald Green Cocktail Dress':
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&h=1600&fit=crop&q=85',
  'Floral Maxi Dress':
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=1200&h=1600&fit=crop&q=85',
  'Knit Sweater Dress':
    'https://images.unsplash.com/photo-1566479179817-c2b6d2e98e25?w=1200&h=1600&fit=crop&q=85',
  'Little Black Dress':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=1600&fit=crop&q=85',
  'Navy Blazer Dress':
    'https://images.unsplash.com/photo-1580219817503-25c561c3b5e4?w=1200&h=1600&fit=crop&q=85',
  'White Shirt Dress':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&h=1600&fit=crop&q=85',

  // OUTERWEAR
  'Beige Trench Coat':
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=1600&fit=crop&q=85',
  'Black Leather Jacket':
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=1600&fit=crop&q=85',
  'Camel Wool Coat':
    'https://images.unsplash.com/photo-1578164842884-d8b1fd76c0d7?w=1200&h=1600&fit=crop&q=85',
  'Denim Jacket':
    'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=1200&h=1600&fit=crop&q=85',
  'Navy Blazer':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1600&fit=crop&q=85',

  // SHOES
  'Beige Ballet Flats':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&h=800&fit=crop&q=85',
  'Black Leather Ankle Boots':
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=1200&h=800&fit=crop&q=85',
  'Black Strappy Sandals':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&h=800&fit=crop&q=85',
  'Brown Knee-High Boots':
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=1200&h=800&fit=crop&q=85',
  'Cognac Leather Loafers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=800&fit=crop&q=85',
  'Espadrille Wedges':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=1200&h=800&fit=crop&q=85',
  'Nude Pointed-Toe Pumps':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&h=800&fit=crop&q=85',
  'White Sneakers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&h=800&fit=crop&q=85',

  // ACCESSORIES
  'Black Evening Clutch':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Black Leather Belt':
    'https://images.unsplash.com/photo-1571019613540-996a1b4ffbec?w=1200&h=800&fit=crop&q=85',
  'Black Leather Tote Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Cognac Brown Crossbody Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Emerald Green Handbag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Gold Chain Bracelet':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
  'Oversized Sunglasses':
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&h=800&fit=crop&q=85',
  'Pearl Earrings':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
  'Raffia Market Tote':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=800&fit=crop&q=85',
  'Silk Scarf':
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=1200&h=800&fit=crop&q=85',
  'Statement Gold Necklace':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=800&fit=crop&q=85',
};

async function downloadImage(url) {
  console.log(`📥 Downloading from: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error(`❌ Download failed:`, error);
    throw error;
  }
}

async function uploadToSupabaseStorage(buffer, filename) {
  try {
    console.log(`📤 Uploading ${filename} to Supabase Storage...`);

    const { data, error } = await supabase.storage
      .from('wardrobe-images')
      .upload(`items/${filename}`, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('wardrobe-images')
      .getPublicUrl(`items/${filename}`);

    console.log(`✅ Uploaded to: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error(`❌ Upload failed for ${filename}:`, error);
    throw error;
  }
}

async function updateItemImageUrl(itemId, newImageUrl) {
  try {
    const { error } = await supabase
      .from('clothing_items')
      .update({ image_url: newImageUrl })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Database update error: ${error.message}`);
    }

    console.log(`✅ Updated database for item ${itemId}`);
  } catch (error) {
    console.error(`❌ Database update failed for ${itemId}:`, error);
    throw error;
  }
}

async function processAllItems() {
  console.log('🚀 Starting image download and upload process...\n');

  // Get all items from database
  const { data: items, error } = await supabase
    .from('clothing_items')
    .select('id, name, category, subcategory')
    .eq('user_id', 'f65547d7-6b51-4606-8a15-f292f6453f34')
    .order('category', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch items:', error);
    return;
  }

  console.log(`📋 Found ${items.length} items to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      console.log(`\n🔄 Processing: ${item.name} (${item.category})`);

      const imageUrl = SPECIFIC_IMAGE_URLS[item.name];
      if (!imageUrl) {
        console.log(`⚠️  No specific image URL found for: ${item.name}`);
        continue;
      }

      // Download image
      const imageBuffer = await downloadImage(imageUrl);

      // Generate filename
      const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${item.id.substring(0, 8)}.jpg`;

      // Upload to Supabase Storage
      const supabaseUrl = await uploadToSupabaseStorage(imageBuffer, filename);

      // Update database
      await updateItemImageUrl(item.id, supabaseUrl);

      successCount++;
      console.log(`✅ Successfully processed: ${item.name}`);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to process ${item.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Process completed!`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Total: ${items.length}`);
}

// Run the process
processAllItems().catch(console.error);
