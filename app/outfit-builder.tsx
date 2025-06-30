import { router, useLocalSearchParams } from 'expo-router';
import { Save, Shirt, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MinimalAddItemCard } from '../components/outfits/MinimalAddItemCard';
import { MinimalOutfitItemCard } from '../components/outfits/MinimalOutfitItemCard';
import { BodyMedium, Button, Input } from '../components/ui';
import { Colors } from '../constants/Colors';
import { Shadows } from '../constants/Shadows';
import { Layout, Spacing } from '../constants/Spacing';
import { useManualOutfits } from '../hooks/useManualOutfits';
import { useWardrobe } from '../hooks/useWardrobe';
import { OutfitService } from '../lib/outfitService';
import { ClothingItem } from '../types/wardrobe';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export default function OutfitBuilderScreen() {
  const { editOutfitId } = useLocalSearchParams<{ editOutfitId?: string }>();
  const { items, outfits, selectedItems, actions } = useWardrobe();
  const { refreshManualOutfits } = useManualOutfits();

  const editOutfit = editOutfitId
    ? outfits.find(o => o.id === editOutfitId)
    : undefined;

  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>(
    editOutfit?.items || items.filter(item => selectedItems.includes(item.id))
  );
  const [outfitName, setOutfitName] = useState(editOutfit?.name || '');
  const [notes, setNotes] = useState(editOutfit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const availableItems = items.filter(
    item => !outfitItems.some(outfitItem => outfitItem.id === item.id)
  );

  const handleAddItem = (item: ClothingItem) => {
    setOutfitItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (itemId: string) => {
    setOutfitItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleToggleItem = (item: ClothingItem) => {
    const isInOutfit = outfitItems.some(
      outfitItem => outfitItem.id === item.id
    );

    if (isInOutfit) {
      handleRemoveItem(item.id);
    } else {
      handleAddItem(item);
    }
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

    setIsSaving(true);

    try {
      if (editOutfit) {
        await OutfitService.updateOutfit(
          editOutfit.id,
          outfitName.trim(),
          outfitItems,
          [],
          [],
          notes.trim()
        );

        await refreshManualOutfits();

        Alert.alert('Success', 'Your outfit has been updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        await OutfitService.saveManualOutfit(
          outfitName.trim(),
          outfitItems,
          [],
          [],
          notes.trim()
        );

        await refreshManualOutfits();

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

      actions.clearSelection();

      if (editOutfit) {
        router.back();
      }
    } catch (error) {
      console.error('Error saving manual outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderOutfitItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <View
      style={[
        styles.outfitItemContainer,
        index < outfitItems.length - 1 && { marginRight: Spacing.lg },
      ]}
    >
      <MinimalOutfitItemCard
        item={item}
        index={index}
        onRemove={() => handleToggleItem(item)}
      />
    </View>
  );

  const renderAvailableItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <View
      style={[
        styles.availableItemContainer,
        index < availableItems.length - 1 && { marginRight: Spacing.lg },
      ]}
    >
      <MinimalAddItemCard
        item={item}
        index={index}
        onAdd={() => handleToggleItem(item)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Shirt size={24} color="#A428FC" />
            <Text style={styles.headerTitle}>
              {editOutfit ? 'Edit Outfit' : 'Create Outfit'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <X size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Outfit Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outfit Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Outfit Name *</Text>
            <Input
              placeholder="Enter outfit name"
              value={outfitName}
              onChangeText={setOutfitName}
              inputStyle={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <Input
              placeholder="Add notes about this outfit"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              inputStyle={styles.textArea}
            />
          </View>
        </View>

        {/* Current Outfit Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Outfit Items ({outfitItems.length})
          </Text>
          {outfitItems.length > 0 ? (
            <FlatList
              data={outfitItems}
              renderItem={renderOutfitItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.outfitItemsList}
              style={styles.outfitScrollView}
              decelerationRate="fast"
              snapToAlignment="center"
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

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button
            title={isSaving ? 'Saving...' : 'Save Outfit'}
            onPress={handleSave}
            disabled={
              isSaving || !outfitName.trim() || outfitItems.length === 0
            }
            loading={isSaving}
            leftIcon={<Save size={20} color={Colors.white} />}
            variant="primary"
            size="medium"
            fullWidth
          />
        </View>

        {/* Available Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Items</Text>
          {availableItems.length > 0 ? (
            <FlatList
              data={availableItems}
              renderItem={renderAvailableItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.availableItemsList}
              decelerationRate="fast"
              snapToAlignment="center"
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
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  outfitItemsList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  outfitScrollView: {
    flexGrow: 0,
  },
  outfitItemContainer: {
    position: 'relative',
    width: cardWidth,
  },
  availableItemsList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyOutfit: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
  },
  emptyAvailable: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  saveSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  inputGroup: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
  },
  input: {
    fontSize: 16,
  },
  textArea: {
    fontSize: 16,
    textAlignVertical: 'top',
  },
  gridRow: {
    justifyContent: 'space-between',
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
  availableItemContainer: {
    position: 'relative',
    width: cardWidth,
  },
});
