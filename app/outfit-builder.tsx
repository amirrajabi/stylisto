import { router, useLocalSearchParams } from 'expo-router';
import { Save, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { BodyMedium, Button, H1, H3, Input } from '../components/ui';
import { ClothingItemCard } from '../components/wardrobe/ClothingItemCard';
import { Colors } from '../constants/Colors';
import { Layout, Spacing } from '../constants/Spacing';
import { useWardrobe } from '../hooks/useWardrobe';
import { OutfitService } from '../lib/outfitService';
import { ClothingItem, Outfit } from '../types/wardrobe';

export default function OutfitBuilderScreen() {
  const { editOutfitId } = useLocalSearchParams<{ editOutfitId?: string }>();
  const { items, outfits, selectedItems, actions } = useWardrobe();

  const editOutfit = editOutfitId
    ? outfits.find(o => o.id === editOutfitId)
    : undefined;

  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>(
    editOutfit?.items || items.filter(item => selectedItems.includes(item.id))
  );
  const [outfitName, setOutfitName] = useState(editOutfit?.name || '');
  const [notes, setNotes] = useState(editOutfit?.notes || '');

  const availableItems = items.filter(
    item => !outfitItems.some(outfitItem => outfitItem.id === item.id)
  );

  const handleAddItem = (item: ClothingItem) => {
    setOutfitItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (itemId: string) => {
    setOutfitItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSave = async () => {
    if (!outfitName.trim()) {
      Alert.alert('Error', 'Please enter an outfit name');
      return;
    }

    if (outfitItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the outfit');
      return;
    }

    try {
      if (editOutfit) {
        // Update existing outfit in local storage
        const outfit: Outfit = {
          id: editOutfit.id,
          name: outfitName.trim(),
          items: outfitItems,
          occasion: editOutfit.occasion || [],
          season: editOutfit.season || [],
          tags: editOutfit.tags || [],
          isFavorite: editOutfit.isFavorite || false,
          timesWorn: editOutfit.timesWorn || 0,
          lastWorn: editOutfit.lastWorn,
          notes: notes.trim(),
          createdAt: editOutfit.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        actions.updateOutfit(outfit);
      } else {
        // Save new manual outfit to database
        await OutfitService.saveManualOutfit(
          outfitName.trim(),
          outfitItems,
          [], // occasions
          [], // seasons
          notes.trim()
        );

        Alert.alert(
          'Success',
          'Your manual outfit has been saved! It will appear in the Stylist tab along with AI-generated outfits.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }

      // Clear selection
      actions.clearSelection();

      if (editOutfit) {
        router.back();
      }
    } catch (error) {
      console.error('Error saving manual outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.');
    }
  };

  const renderOutfitItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <View style={styles.outfitItemContainer}>
      <ClothingItemCard
        item={item}
        index={index}
        onPress={() => {}}
        onToggleFavorite={() => actions.toggleFavorite(item.id)}
        onMoreOptions={() => handleRemoveItem(item.id)}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveItem(item.id)}
      >
        <X size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderAvailableItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <ClothingItemCard
      item={item}
      index={index}
      onPress={() => handleAddItem(item)}
      onToggleFavorite={() => actions.toggleFavorite(item.id)}
      onMoreOptions={() => {}}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <H1>{editOutfit ? 'Edit Outfit' : 'Create Outfit'}</H1>
          <Button
            title="Save"
            onPress={handleSave}
            leftIcon={<Save size={20} color={Colors.white} />}
          />
        </View>

        {/* AI Training Description */}
        {!editOutfit && (
          <View style={styles.aiTrainingSection}>
            <BodyMedium style={styles.aiTrainingText}>
              ✨ Your manual outfit creations help train our AI to understand
              your style preferences and create better recommendations in the
              future!
            </BodyMedium>
          </View>
        )}

        {/* Outfit Details */}
        <View style={styles.section}>
          <Input
            label="Outfit Name"
            placeholder="Enter outfit name"
            value={outfitName}
            onChangeText={setOutfitName}
            required
          />
          <Input
            label="Notes"
            placeholder="Add notes about this outfit"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Current Outfit Items */}
        <View style={styles.section}>
          <H3 style={styles.sectionTitle}>
            Outfit Items ({outfitItems.length})
          </H3>
          {outfitItems.length > 0 ? (
            <FlatList
              data={outfitItems}
              renderItem={renderOutfitItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitItemsList}
            />
          ) : (
            <View style={styles.emptyOutfit}>
              <BodyMedium color="secondary">
                No items added yet. Select items from below to build your
                outfit.
              </BodyMedium>
            </View>
          )}
        </View>

        {/* Available Items */}
        <View style={styles.section}>
          <H3 style={styles.sectionTitle}>Add Items</H3>
          {availableItems.length > 0 ? (
            <FlatList
              data={availableItems}
              renderItem={renderAvailableItem}
              keyExtractor={item => item.id}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.availableItemsList}
            />
          ) : (
            <View style={styles.emptyAvailable}>
              <BodyMedium color="secondary">
                All items have been added to the outfit.
              </BodyMedium>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  outfitItemsList: {
    paddingRight: Spacing.lg,
  },
  outfitItemContainer: {
    position: 'relative',
    marginRight: Spacing.md,
    width: 150,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableItemsList: {
    gap: Spacing.md,
  },
  emptyOutfit: {
    padding: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
  },
  emptyAvailable: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  aiTrainingSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  aiTrainingText: {
    textAlign: 'center',
  },
});
