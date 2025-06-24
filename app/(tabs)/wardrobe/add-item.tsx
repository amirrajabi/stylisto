import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AddItemModal } from '../../../components/wardrobe/AddItemModal';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { ClothingItem } from '../../../types/wardrobe';

export default function AddItemScreen() {
  const { editItemId } = useLocalSearchParams<{ editItemId?: string }>();
  const { items, actions } = useWardrobe();
  
  const editItem = editItemId ? items.find(item => item.id === editItemId) : undefined;

  const handleAddItem = (item: ClothingItem) => {
    if (editItem) {
      actions.updateItem(item);
    } else {
      actions.addItem(item);
    }
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AddItemModal
        visible={true}
        onClose={handleClose}
        onAddItem={handleAddItem}
        editItem={editItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});