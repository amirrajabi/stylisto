import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useWardrobe } from '../../hooks/useWardrobe';
import { Button } from '../ui/Button';

export const ClearMockData: React.FC = () => {
  const { actions, isLoading } = useWardrobe();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearMockData = async () => {
    Alert.alert(
      'Clear All Mock Data',
      'This will clear all cached data and ensure only real database items are shown.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await actions.clearAllData();
              if (result.success) {
                await actions.loadClothingItems();
                Alert.alert(
                  'Success',
                  'All mock data has been cleared. Only real database items will be shown.'
                );
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'Failed to clear mock data.'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: '#fff3cd',
        borderRadius: 8,
        margin: 20,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Clear Mock Data
      </Text>
      <Text style={{ marginBottom: 20, color: '#666' }}>
        If you see fake/mock items that are not in your database, use this to
        clear all cached data.
      </Text>
      <Button
        title={isClearing ? 'Clearing...' : 'Clear All Mock Data'}
        onPress={handleClearMockData}
        disabled={isLoading || isClearing}
        variant="destructive"
      />
    </View>
  );
};
