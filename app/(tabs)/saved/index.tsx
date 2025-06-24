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
import { router } from 'expo-router';
import { Plus, Heart } from 'lucide-react-native';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { OutfitCard } from '../../../components/wardrobe/OutfitCard';
import { Outfit } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1, BodyMedium } from '../../../components/ui';

export default function SavedScreen() {
  const { outfits, actions } = useWardrobe();

  const handleOutfitPress = (outfit: Outfit) => {
    router.push({
      pathname: '/outfit-detail',
      params: { outfitId: outfit.id }
    });
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
            router.push({
              pathname: '/outfit-builder',
              params: { editOutfitId: outfit.id }
            });
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
          { text: 'Edit', onPress: () => {
            router.push({
              pathname: '/outfit-builder',
              params: { editOutfitId: outfit.id }
            });
          }},
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

  const handleCreateOutfit = () => {
    router.push('/outfit-builder');
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
        <H1>Saved Outfits</H1>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateOutfit}
          accessibilityLabel="Create new outfit"
        >
          <Plus size={24} color={Colors.white} />
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
            <Heart size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyTitle}>No saved outfits yet</Text>
            <BodyMedium color="secondary" style={styles.emptySubtitle}>
              Create your first outfit by combining items from your wardrobe
            </BodyMedium>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleCreateOutfit}
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
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  addButton: {
    backgroundColor: Colors.primary[700],
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  emptyButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});