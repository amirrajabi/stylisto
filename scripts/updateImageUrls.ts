// High-quality Unsplash URLs for each clothing category and item type
const HIGH_QUALITY_IMAGES = {
  // TOPS
  'Black Silk Camisole':
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
  'Black Turtleneck':
    'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80',
  'Classic White Button-Down Shirt':
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
  'Cream Silk Blouse':
    'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80',
  'Floral Print Blouse':
    'https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=800&q=80',
  'Navy Blue Cashmere Sweater':
    'https://images.unsplash.com/photo-1556821840-3a9fbc86ea14?w=800&q=80',
  'Oversized White Cotton T-Shirt':
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  'Striped Long-Sleeve Tee':
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',

  // BOTTOMS
  'Beige Linen Pants':
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&q=80',
  'Black Leather Mini Skirt':
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80',
  'Black Tailored Trousers':
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
  'High-Waist Dark Wash Jeans':
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
  'Navy Pencil Skirt':
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&q=80',
  'Pleated Midi Skirt':
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=800&q=80',
  'White Wide-Leg Jeans':
    'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800&q=80',

  // DRESSES
  'Emerald Green Cocktail Dress':
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
  'Floral Maxi Dress':
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
  'Knit Sweater Dress':
    'https://images.unsplash.com/photo-1566479179817-c2b6d2e98e25?w=800&q=80',
  'Little Black Dress':
    'https://images.unsplash.com/photo-1566479179817-c2b6d2e98e25?w=800&q=80',
  'Navy Blazer Dress':
    'https://images.unsplash.com/photo-1580219817503-25c561c3b5e4?w=800&q=80',
  'White Shirt Dress':
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',

  // OUTERWEAR
  'Beige Trench Coat':
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
  'Black Leather Jacket':
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  'Camel Wool Coat':
    'https://images.unsplash.com/photo-1578164842884-d8b1fd76c0d7?w=800&q=80',
  'Denim Jacket':
    'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800&q=80',
  'Navy Blazer':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',

  // SHOES
  'Beige Ballet Flats':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
  'Black Leather Ankle Boots':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
  'Black Strappy Sandals':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
  'Brown Knee-High Boots':
    'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&q=80',
  'Cognac Leather Loafers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
  'Espadrille Wedges':
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
  'Nude Pointed-Toe Pumps':
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80',
  'White Sneakers':
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',

  // ACCESSORIES
  'Black Evening Clutch':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Black Leather Belt':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Black Leather Tote Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Cognac Brown Crossbody Bag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Emerald Green Handbag':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Gold Chain Bracelet':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
  'Oversized Sunglasses':
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
  'Pearl Earrings':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
  'Raffia Market Tote':
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  'Silk Scarf':
    'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80',
  'Statement Gold Necklace':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
};

console.log('🚀 Starting image URL update process...');
console.log(
  `📋 Will update ${Object.keys(HIGH_QUALITY_IMAGES).length} items with high-quality images`
);

// Log all the update commands that need to be run
Object.entries(HIGH_QUALITY_IMAGES).forEach(([itemName, imageUrl], index) => {
  console.log(`\n[${index + 1}] ${itemName}:`);
  console.log(`   📸 New URL: ${imageUrl}`);
});

console.log('\n✅ Image URL mapping complete!');
