import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ClothingCategory } from '../../../types/wardrobe';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Card } from '../../../components/ui';

export default function CategoriesScreen() {
  const { items } = useWardrobe();

  const categoryData = Object.values(ClothingCategory).map(category => {
    const categoryItems = items.filter(item => item.category === category);
    return {
      category,
      count: categoryItems.length,
      displayName: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };
  });

  const handleCategoryPress = (category: ClothingCategory) => {
    router.push({
      pathname: '/wardrobe',
      params: { category }
    });
  };

  const renderCategory = ({ item }: { item: typeof categoryData[0] }) => (
    <Card
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.category)}
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.displayName}</Text>
          <Text style={styles.categoryCount}>
            {item.count} item{item.count !== 1 ? 's' : ''}
          </Text>
        </View>
        <ChevronRight size={20} color={Colors.text.tertiary} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={categoryData}
        renderItem={renderCategory}
        keyExtractor={item => item.category}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  listContainer: {
    padding: Spacing.md,
  },
  categoryCard: {
    marginBottom: Spacing.md,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  categoryCount: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
});