import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywbbsdqdkucrvyowukcs.supabase.co';
// Using service role key for storage operations
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
  color: string;
  brand: string;
  image_url: string;
}

const wardrobeItems: ClothingItem[] = [
  {
    id: '79a78eab-9f13-4f80-8ca9-eccd0a636c67',
    name: 'Black Silk Camisole',
    category: 'tops',
    subcategory: 'camisole',
    color: '#000000',
    brand: 'Equipment',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '57bfc11b-002f-4019-bc14-bdb45c0ca385',
    name: 'Black Turtleneck',
    category: 'tops',
    subcategory: 'sweater',
    color: '#000000',
    brand: 'Everlane',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '56d6cdef-9d6e-49a1-a3d7-5a64e245f86a',
    name: 'Classic White Button-Down Shirt',
    category: 'tops',
    subcategory: 'blouse',
    color: '#FFFFFF',
    brand: 'Everlane',
    image_url:
      'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'd34ab9aa-7f9f-4ac0-93ec-e6f303be6419',
    name: 'Cream Silk Blouse',
    category: 'tops',
    subcategory: 'blouse',
    color: '#F5F5DC',
    brand: 'Róhe',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '9f3cd69a-effb-4c39-a47f-1fa4785608f5',
    name: 'Floral Print Blouse',
    category: 'tops',
    subcategory: 'blouse',
    color: '#FFB6C1',
    brand: 'Zimmermann',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '22ebdabc-3c14-4261-b7a0-e5754be32ffc',
    name: 'Navy Blue Cashmere Sweater',
    category: 'tops',
    subcategory: 'sweater',
    color: '#1e3a8a',
    brand: 'Éterne',
    image_url:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '7f328ded-e93e-491e-abd9-7f9d006d55d0',
    name: 'Oversized White Cotton T-Shirt',
    category: 'tops',
    subcategory: 't-shirt',
    color: '#FFFFFF',
    brand: 'Leset',
    image_url:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '7392800a-9a2a-45c6-b97c-f0bce9e3c59a',
    name: 'Striped Long-Sleeve Tee',
    category: 'tops',
    subcategory: 't-shirt',
    color: '#000080',
    brand: 'La Ligne',
    image_url:
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'ecac53f1-5aea-48e6-99db-2011fe46ad8d',
    name: 'Beige Linen Pants',
    category: 'bottoms',
    subcategory: 'trousers',
    color: '#F5F5DC',
    brand: 'ARKET',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '9f743e51-d67e-4984-9e0f-fc12c2b7f177',
    name: 'Black Leather Mini Skirt',
    category: 'bottoms',
    subcategory: 'skirt',
    color: '#000000',
    brand: 'Khaite',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '160d80d7-6e86-4330-99b8-10859c9a5116',
    name: 'Black Tailored Trousers',
    category: 'bottoms',
    subcategory: 'trousers',
    color: '#000000',
    brand: 'The Frankie Shop',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '06e686fa-a65e-48b5-a91b-1341cd366f82',
    name: 'High-Waist Dark Wash Jeans',
    category: 'bottoms',
    subcategory: 'jeans',
    color: '#1a237e',
    brand: 'Agolde',
    image_url:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '63031fdb-7cf9-4738-9cb6-77c5fd589779',
    name: 'Navy Pencil Skirt',
    category: 'bottoms',
    subcategory: 'skirt',
    color: '#1e3a8a',
    brand: 'Toteme',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'dcb397f1-5235-452f-a505-a1ad1da9396d',
    name: 'Pleated Midi Skirt',
    category: 'bottoms',
    subcategory: 'skirt',
    color: '#DEB887',
    brand: 'Ganni',
    image_url:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '33c4c280-87ce-49cb-9b59-177846b86575',
    name: 'White Wide-Leg Jeans',
    category: 'bottoms',
    subcategory: 'jeans',
    color: '#FFFFFF',
    brand: 'Frame',
    image_url:
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '3b3865f5-bf8e-4188-b19d-0fdab300fcbf',
    name: 'Emerald Green Cocktail Dress',
    category: 'dresses',
    subcategory: 'cocktail',
    color: '#50C878',
    brand: 'Bottega Veneta',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '4a3363b0-52dc-4f57-b2b4-bb4768b596d3',
    name: 'Floral Maxi Dress',
    category: 'dresses',
    subcategory: 'maxi',
    color: '#FFB6C1',
    brand: 'Zimmermann',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '56b51268-d2ab-4079-9797-54e243137ee7',
    name: 'Knit Sweater Dress',
    category: 'dresses',
    subcategory: 'casual',
    color: '#8B4513',
    brand: 'Cos',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'c4c09db8-0c5e-4dd1-8032-8ef19955b406',
    name: 'Little Black Dress',
    category: 'dresses',
    subcategory: 'cocktail',
    color: '#000000',
    brand: 'Another Tomorrow',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '574386be-5092-4c03-93a8-38681a5c375e',
    name: 'Navy Blazer Dress',
    category: 'dresses',
    subcategory: 'work',
    color: '#1e3a8a',
    brand: 'Theory',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'e912fd50-cef6-4558-9292-15309f816716',
    name: 'White Shirt Dress',
    category: 'dresses',
    subcategory: 'casual',
    color: '#FFFFFF',
    brand: 'Proenza Schouler',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'a1b18d07-ee74-433d-b63b-f69caa95d9e1',
    name: 'Beige Trench Coat',
    category: 'outerwear',
    subcategory: 'coat',
    color: '#F5F5DC',
    brand: 'Mango',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '497cc7c5-fac4-462a-aa16-af3ed033d3d7',
    name: 'Black Leather Jacket',
    category: 'outerwear',
    subcategory: 'jacket',
    color: '#000000',
    brand: 'Nour Hammour',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '548a3b29-dd55-4db2-b12a-7282c20cd92f',
    name: 'Camel Wool Coat',
    category: 'outerwear',
    subcategory: 'coat',
    color: '#C19A6B',
    brand: 'Max Mara',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '1b2cf11c-15ad-4c29-af8b-07d5eda924fd',
    name: 'Denim Jacket',
    category: 'outerwear',
    subcategory: 'jacket',
    color: '#4682B4',
    brand: "Levi's",
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'b737ba48-7e43-4c8d-8249-42e392eaeab7',
    name: 'Navy Blazer',
    category: 'outerwear',
    subcategory: 'blazer',
    color: '#1e3a8a',
    brand: 'Toteme',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'e4f56a0b-d3be-47ab-b76e-84ed64209ec4',
    name: 'Beige Ballet Flats',
    category: 'shoes',
    subcategory: 'flats',
    color: '#F5F5DC',
    brand: 'Repetto',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'ced1e2a7-e0cd-40eb-853e-13fc33e0f9f8',
    name: 'Black Leather Ankle Boots',
    category: 'shoes',
    subcategory: 'boots',
    color: '#000000',
    brand: 'Reformation',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '20782978-3f29-4413-8cb1-de3b7951b966',
    name: 'Black Strappy Sandals',
    category: 'shoes',
    subcategory: 'sandals',
    color: '#000000',
    brand: 'Stuart Weitzman',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'a9d02408-20fe-40a2-a4f8-4b1700743263',
    name: 'Brown Knee-High Boots',
    category: 'shoes',
    subcategory: 'boots',
    color: '#8B4513',
    brand: 'Gianvito Rossi',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'bc5d4dee-8b20-45cc-a9c6-649dcc57dcd2',
    name: 'Cognac Leather Loafers',
    category: 'shoes',
    subcategory: 'flats',
    color: '#A0522D',
    brand: 'Gucci',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'fdb34d5e-b934-4325-88fb-eee8863a6be8',
    name: 'Espadrille Wedges',
    category: 'shoes',
    subcategory: 'wedges',
    color: '#DEB887',
    brand: 'Castañer',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'fc4953ed-0af9-4073-8d11-5e88cd8ea9f6',
    name: 'Nude Pointed-Toe Pumps',
    category: 'shoes',
    subcategory: 'heels',
    color: '#FDBCB4',
    brand: 'Jimmy Choo',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '201d6cf6-0adf-43a1-b43c-5c876536c2cf',
    name: 'White Sneakers',
    category: 'shoes',
    subcategory: 'sneakers',
    color: '#FFFFFF',
    brand: 'Common Projects',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '84ab034a-58e4-4397-8eff-b51d9cee30d2',
    name: 'Black Evening Clutch',
    category: 'accessories',
    subcategory: 'handbag',
    color: '#000000',
    brand: 'Judith Leiber',
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'f490ec5e-b24a-44ad-abdb-aea9e33034d8',
    name: 'Black Leather Belt',
    category: 'accessories',
    subcategory: 'belt',
    color: '#000000',
    brand: 'Hermès',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '38b2d734-4eda-4ce2-97f5-d115f462c5fc',
    name: 'Black Leather Tote Bag',
    category: 'accessories',
    subcategory: 'handbag',
    color: '#000000',
    brand: 'Mansur Gavriel',
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'fc9a92ab-4132-4f55-b812-35289a988c4a',
    name: 'Cognac Brown Crossbody Bag',
    category: 'accessories',
    subcategory: 'handbag',
    color: '#A0522D',
    brand: 'Polene',
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '9fa192f1-25ae-4665-9f68-b597d2582790',
    name: 'Emerald Green Handbag',
    category: 'accessories',
    subcategory: 'handbag',
    color: '#50C878',
    brand: 'Staud',
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'ce3c390c-2f43-4bf6-816e-766670a6eada',
    name: 'Gold Chain Bracelet',
    category: 'accessories',
    subcategory: 'jewelry',
    color: '#FFD700',
    brand: 'Cartier',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '6511750c-7211-49cf-ad14-f50d587b7519',
    name: 'Oversized Sunglasses',
    category: 'accessories',
    subcategory: 'sunglasses',
    color: '#000000',
    brand: 'Celine',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '3a24beb1-3b9d-4662-ac62-d79b33418357',
    name: 'Pearl Earrings',
    category: 'accessories',
    subcategory: 'jewelry',
    color: '#F8F8FF',
    brand: 'Mikimoto',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: 'ff209118-4de9-47fe-a91d-b3a07a695fcd',
    name: 'Raffia Market Tote',
    category: 'accessories',
    subcategory: 'handbag',
    color: '#DEB887',
    brand: 'Dragon Diffusion',
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '9f9b2788-b3e2-4d69-8ecc-68795c74085c',
    name: 'Silk Scarf',
    category: 'accessories',
    subcategory: 'scarf',
    color: '#FFB6C1',
    brand: 'Hermès',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
  {
    id: '820a904c-2d01-4a6a-ae20-6e80a99d716b',
    name: 'Statement Gold Necklace',
    category: 'accessories',
    subcategory: 'jewelry',
    color: '#FFD700',
    brand: 'Jennifer Fisher',
    image_url:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop&q=80',
  },
];

async function downloadImage(url: string, filename: string): Promise<Buffer> {
  try {
    console.log(`📥 Downloading image for ${filename}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Downloaded ${filename} (${buffer.length} bytes)`);
    return buffer;
  } catch (error) {
    console.error(`❌ Error downloading ${filename}:`, error);
    throw error;
  }
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    console.log(`📤 Uploading ${filename} to Supabase Storage...`);

    const { data, error } = await supabase.storage
      .from('clothing-images')
      .upload(`wardrobe/${filename}`, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('clothing-images')
      .getPublicUrl(`wardrobe/${filename}`);

    console.log(`✅ Uploaded ${filename} successfully`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Error uploading ${filename}:`, error);
    throw error;
  }
}

async function updateItemImageUrl(
  itemId: string,
  newImageUrl: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('clothing_items')
      .update({ image_url: newImageUrl })
      .eq('id', itemId);

    if (error) {
      throw error;
    }

    console.log(`✅ Updated database for item ${itemId}`);
  } catch (error) {
    console.error(`❌ Error updating database for item ${itemId}:`, error);
    throw error;
  }
}

async function processImages(): Promise<void> {
  console.log(
    `🚀 Starting image download and upload process for ${wardrobeItems.length} items...`
  );

  const results = {
    success: 0,
    failed: 0,
    failedItems: [] as string[],
  };

  for (let i = 0; i < wardrobeItems.length; i++) {
    const item = wardrobeItems[i];
    const filename = `${item.category}_${item.subcategory}_${item.id}.jpg`;

    try {
      console.log(
        `\n[${i + 1}/${wardrobeItems.length}] Processing: ${item.name}`
      );

      const imageBuffer = await downloadImage(item.image_url, filename);

      const newImageUrl = await uploadToSupabase(imageBuffer, filename);

      await updateItemImageUrl(item.id, newImageUrl);

      results.success++;
      console.log(`🎉 Successfully processed ${item.name}`);

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`💥 Failed to process ${item.name}:`, error);
      results.failed++;
      results.failedItems.push(item.name);
    }
  }

  console.log(`\n📊 FINAL RESULTS:`);
  console.log(`✅ Successfully processed: ${results.success} items`);
  console.log(`❌ Failed: ${results.failed} items`);

  if (results.failedItems.length > 0) {
    console.log(`\n💀 Failed items:`);
    results.failedItems.forEach(item => console.log(`  - ${item}`));
  }
}

if (require.main === module) {
  processImages().catch(console.error);
}

export { processImages };
