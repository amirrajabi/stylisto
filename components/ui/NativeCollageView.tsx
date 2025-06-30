import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';

interface NativeCollageViewProps {
  userImage: string;
  clothingImages: string[];
  width: number;
  height: number;
  viewShotRef: React.RefObject<ViewShot | null>;
  onReady?: () => void;
}

export const NativeCollageView: React.FC<NativeCollageViewProps> = ({
  userImage,
  clothingImages,
  width,
  height,
  viewShotRef,
  onReady,
}) => {
  const [isLayoutReady, setIsLayoutReady] = React.useState(false);

  useEffect(() => {
    console.log('🖼️ NativeCollageView mounted with:', {
      hasUserImage: !!userImage,
      clothingCount: clothingImages.length,
      dimensions: `${width}x${height}`,
      hasRef: !!viewShotRef,
      isLayoutReady,
    });
  }, [isLayoutReady]);

  const handleLayout = () => {
    console.log('📐 NativeCollageView layout complete');
    setIsLayoutReady(true);
    onReady?.();
  };

  // Layout configuration
  const padding = 12;
  const itemGap = 8;
  const columnGap = 12;
  const bottomSafeArea = 24;

  // Left side for clothing items (45% of width)
  const leftWidth = width * 0.45;
  const rightWidth = width * 0.55 - padding * 2;

  // Adjust available height for full body image
  const fullBodyHeight = height - bottomSafeArea;

  // Two column layout: Maximum 10 items (5 per column)
  const maxItemsToShow = Math.min(clothingImages.length, 10);
  const itemsPerColumn = 5;
  const numberOfColumns = Math.min(
    Math.ceil(maxItemsToShow / itemsPerColumn),
    2
  );

  // Calculate column dimensions
  const availableWidth = leftWidth - padding * 2;
  const availableHeight = fullBodyHeight - padding * 2;

  // Column width calculation
  const columnWidth =
    numberOfColumns === 1 ? availableWidth : (availableWidth - columnGap) / 2;

  // Item size calculation for each column
  const itemsInFirstColumn = Math.min(clothingImages.length, itemsPerColumn);
  const itemsInSecondColumn = Math.max(
    0,
    clothingImages.length - itemsPerColumn
  );

  const itemWidth = columnWidth;
  const itemHeight =
    itemsInFirstColumn > 0
      ? (availableHeight - itemGap * (itemsInFirstColumn - 1)) /
        itemsInFirstColumn
      : availableHeight;

  // Center the columns vertically if needed
  const totalColumnHeight =
    itemsInFirstColumn * itemHeight + (itemsInFirstColumn - 1) * itemGap;
  const columnTopOffset = Math.max(
    0,
    (availableHeight - totalColumnHeight) / 2
  );

  // Function to get position for an item
  const getItemPosition = (index: number) => {
    const isFirstColumn = index < itemsPerColumn;
    const columnIndex = isFirstColumn ? 0 : 1;
    const itemIndexInColumn = isFirstColumn ? index : index - itemsPerColumn;

    const x = padding + columnIndex * (columnWidth + columnGap);
    const y =
      padding + columnTopOffset + itemIndexInColumn * (itemHeight + itemGap);

    return { x, y };
  };

  return (
    <ViewShot
      ref={viewShotRef}
      style={[styles.container, { width, height }]}
      options={{ format: 'jpg', quality: 0.9 }}
      onLayout={handleLayout}
    >
      {/* Background */}
      <View style={styles.background} />

      {/* Left side - Clothing items in two vertical columns */}
      <View
        style={[
          styles.leftColumn,
          { width: leftWidth, height: fullBodyHeight },
        ]}
      >
        {clothingImages.slice(0, maxItemsToShow).map((image, index) => {
          const position = getItemPosition(index);
          return (
            <Image
              key={index}
              source={{ uri: image }}
              style={[
                styles.clothingItem,
                {
                  width: itemWidth,
                  height: itemHeight,
                  left: position.x,
                  top: position.y,
                },
              ]}
              resizeMode="cover"
            />
          );
        })}
      </View>

      {/* Right side - User full body image */}
      <View
        style={[
          styles.rightColumn,
          { left: leftWidth, width: rightWidth, height: fullBodyHeight },
        ]}
      >
        <Image
          source={{ uri: userImage }}
          style={[
            styles.fullBodyImage,
            {
              width: rightWidth,
              height: fullBodyHeight,
            },
          ]}
          resizeMode="cover"
        />
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  leftColumn: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rightColumn: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clothingItem: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fullBodyImage: {
    borderRadius: 8,
    backgroundColor: 'white',
  },
});
