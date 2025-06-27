const AsyncStorage = require('@react-native-async-storage/async-storage');

const OUTFITS_STORAGE_KEY = '@stylisto_saved_outfits';
const LAST_SYNC_KEY = '@stylisto_outfits_last_sync';

async function clearOutfitCache() {
  try {
    console.log('🗑️ Clearing outfit cache from AsyncStorage...');

    // Clear outfit cache
    await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
    console.log('✅ Cleared outfits from AsyncStorage');

    // Clear sync timestamp
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
    console.log('✅ Cleared sync timestamp from AsyncStorage');

    console.log('🎉 Outfit cache cleared successfully!');
    console.log('📱 Please restart the app to see the changes.');
  } catch (error) {
    console.error('❌ Error clearing outfit cache:', error);
  }
}

if (require.main === module) {
  clearOutfitCache();
}

module.exports = { clearOutfitCache };
