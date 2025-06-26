import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useWardrobe } from '../../hooks/useWardrobe';
import { Button } from '../ui/Button';

export const RemoveSampleItems: React.FC = () => {
  const { actions, isLoading } = useWardrobe();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemoveSampleItems = async () => {
    Alert.alert(
      'Remove Sample Items',
      'Are you sure you want to remove all sample items? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            try {
              const result = await actions.removeSampleItems();
              if (result.success) {
                Alert.alert(
                  'Success',
                  'Sample items have been removed successfully.'
                );
              } else {
                Alert.alert(
                  'Error',
                  result.error || 'Failed to remove sample items.'
                );
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setIsRemoving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Remove Sample Items
      </Text>
      <Text style={{ marginBottom: 20, color: '#666' }}>
        This will remove all sample items (Navy Blue T-Shirt, Black Denim Jeans,
        White Sneakers) from your wardrobe.
      </Text>
      <Button
        title={isRemoving ? 'Removing...' : 'Remove Sample Items'}
        onPress={handleRemoveSampleItems}
        disabled={isLoading || isRemoving}
        variant="destructive"
      />
    </View>
  );
};
