import { router } from 'expo-router';
import { DollarSign, Plus, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SaleItemCard } from '../../../components/wardrobe/SaleItemCard';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { ClothingItem } from '../../../types/wardrobe';

export default function SellingScreen() {
  const { items, isLoading, actions } = useWardrobe();
  const [searchQuery, setSearchQuery] = useState('');
  const [saleItems, setSaleItems] = useState<ClothingItem[]>([]);

  useEffect(() => {
    actions.loadClothingItems();
  }, []);

  useEffect(() => {
    if (items) {
      const forSaleItems = items.filter(item => item.isForSale);
      const filteredItems = searchQuery
        ? forSaleItems.filter(
            item =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.saleListing?.platform
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
        : forSaleItems;
      setSaleItems(filteredItems);
    }
  }, [items, searchQuery]);

  const handleItemPress = (item: ClothingItem) => {
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id },
    });
  };

  const handleAddForSale = () => {
    router.push('/outfit-builder');
  };

  const renderSaleItem = ({ item }: { item: ClothingItem }) => (
    <SaleItemCard item={item} onPress={() => handleItemPress(item)} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <DollarSign size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Items for Sale</Text>
      <Text style={styles.emptyDescription}>
        Mark items as &quot;for sale&quot; in your wardrobe to see them here
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddForSale}>
        <Plus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Browse Wardrobe</Text>
      </TouchableOpacity>
    </View>
  );

  const getTotalValue = () => {
    return saleItems.reduce((total, item) => {
      return total + (item.sellingPrice || 0);
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Items for Sale</Text>
        {saleItems.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {saleItems.length} items • Total value:{' '}
              {formatPrice(getTotalValue())}
            </Text>
          </View>
        )}
      </View>

      {saleItems.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sale items..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <FlatList
        data={saleItems}
        renderItem={renderSaleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={isLoading}
        onRefresh={() => actions.loadClothingItems()}
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
    marginBottom: 8,
  },
  statsContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
