import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Plus, Users } from 'lucide-react-native';
import { useWardrobe } from '../../hooks/useWardrobe';
import { OutfitCard } from '../../components/wardrobe/OutfitCard';
import { Outfit } from '../../types/wardrobe';

export default function OutfitsScreen() {
  const { outfits, actions } = useWardrobe();

  const handleOutfitPress = (outfit: Outfit) => {
    // Navigate to outfit detail screen
    console.log('View outfit details:', outfit.name);
  };

  const handleMoreOptions = (outfit: Outfit) => {
    const options = ['Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Edit outfit
            console.log('Edit outfit:', outfit.name);
          } else if (buttonIndex === 1) {
            Alert.alert(
              'Delete Outfit',
              `Are you sure you want to delete "${outfit.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => actions.deleteOutfit(outfit.id),
                },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        'Outfit Options',
        `What would you like to do with "${outfit.name}"?`,
        [
          { text: 'Edit', onPress: () => console.log('Edit outfit:', outfit.name) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Outfit',
                `Are you sure you want to delete "${outfit.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => actions.deleteOutfit(outfit.id),
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <OutfitCard
      outfit={item}
      onPress={() => handleOutfitPress(item)}
      onToggleFavorite={() => actions.toggleOutfitFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      showStats
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Outfits</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => console.log('Create new outfit')}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Outfits List */}
      <FlatList
        data={outfits}
        renderItem={renderOutfit}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Users size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No outfits yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first outfit by combining items from your wardrobe
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => console.log('Create new outfit')}
            >
              <Text style={styles.emptyButtonText}>Create Outfit</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
  },
});