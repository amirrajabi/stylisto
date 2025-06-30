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
  const bottomSafeArea = 24; // Account for bottom padding to prevent cutoff

  // Left side for clothing items (45% of width)
  const leftWidth = width * 0.45;
  const rightWidth = width * 0.55 - padding * 2;

  // Adjust available height for full body image
  const fullBodyHeight = height - bottomSafeArea;

  // Calculate item size based on available space - show ALL items
  const maxItemsToShow = clothingImages.length; // Show all items
  const availableHeight = fullBodyHeight - padding * 2;
  const itemHeight =
    (availableHeight - itemGap * (maxItemsToShow - 1)) / maxItemsToShow;
  const itemSize = Math.min(itemHeight, leftWidth - padding * 2);

  // Adjust item height if needed to fit nicely
  const finalItemHeight = itemSize;
  const totalItemsHeight =
    finalItemHeight * maxItemsToShow + itemGap * (maxItemsToShow - 1);
  const topOffset = Math.max(0, (fullBodyHeight - totalItemsHeight) / 2);

  return (
    <ViewShot
      ref={viewShotRef}
      style={[styles.container, { width, height }]}
      options={{ format: 'jpg', quality: 0.9 }}
      onLayout={handleLayout}
    >
      {/* Background */}
      <View style={styles.background} />

      {/* Left side - Clothing items in single column */}
      <View
        style={[
          styles.leftColumn,
          { width: leftWidth, height: fullBodyHeight },
        ]}
      >
        {clothingImages.map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={[
              styles.clothingItem,
              {
                width: itemSize,
                height: finalItemHeight,
                left: padding,
                top: topOffset + index * (finalItemHeight + itemGap),
              },
            ]}
            resizeMode="cover"
          />
        ))}
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
