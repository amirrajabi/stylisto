import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button } from '../ui/Button';

const OUTFITS_STORAGE_KEY = '@stylisto_saved_outfits';
const LAST_SYNC_KEY = '@stylisto_outfits_last_sync';

interface ClearOutfitCacheProps {
  onCacheCleared?: () => void;
}

export const ClearOutfitCache: React.FC<ClearOutfitCacheProps> = ({
  onCacheCleared,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const clearOutfitCache = async () => {
    try {
      setIsClearing(true);

      Alert.alert(
        'Clear Outfit Cache',
        'This will clear all cached outfits from your device. Are you sure you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsClearing(false),
          },
          {
            text: 'Clear Cache',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ Clearing outfit cache from AsyncStorage...');

                // Clear outfit cache
                await AsyncStorage.removeItem(OUTFITS_STORAGE_KEY);
                console.log('✅ Cleared outfits from AsyncStorage');

                // Clear sync timestamp
                await AsyncStorage.removeItem(LAST_SYNC_KEY);
                console.log('✅ Cleared sync timestamp from AsyncStorage');

                Alert.alert(
                  'Cache Cleared',
                  'Outfit cache has been cleared successfully. The app will now refresh to show updated data from the database.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        if (onCacheCleared) {
                          onCacheCleared();
                        }
                      },
                    },
                  ]
                );
              } catch (error) {
                console.error('❌ Error clearing outfit cache:', error);
                Alert.alert(
                  'Error',
                  'Failed to clear outfit cache. Please try again.'
                );
              } finally {
                setIsClearing(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error in clearOutfitCache:', error);
      setIsClearing(false);
    }
  };

  return (
    <View>
      <Button
        title={isClearing ? 'Clearing Cache...' : 'Clear Outfit Cache'}
        onPress={clearOutfitCache}
        disabled={isClearing}
        variant="outline"
      />
    </View>
  );
};
