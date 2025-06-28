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

  // Left side for clothing items (45% of width)
  const leftWidth = width * 0.45;
  const rightWidth = width * 0.55 - padding * 2;

  // Calculate item size based on available space
  const maxItemsToShow = Math.min(clothingImages.length, 5); // Show max 5 items
  const availableHeight = height - padding * 2;
  const itemHeight =
    (availableHeight - itemGap * (maxItemsToShow - 1)) / maxItemsToShow;
  const itemSize = Math.min(itemHeight, leftWidth - padding * 2);

  // Adjust item height if needed to fit nicely
  const finalItemHeight = itemSize;
  const totalItemsHeight =
    finalItemHeight * maxItemsToShow + itemGap * (maxItemsToShow - 1);
  const topOffset = (height - totalItemsHeight) / 2;

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
      <View style={[styles.leftColumn, { width: leftWidth, height }]}>
        {clothingImages.slice(0, maxItemsToShow).map((image, index) => (
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
          { left: leftWidth, width: rightWidth, height },
        ]}
      >
        <Image
          source={{ uri: userImage }}
          style={[
            styles.fullBodyImage,
            {
              width: rightWidth - padding,
              height: height - padding * 2,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </ViewShot>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    flexDirection: 'row',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f8f8',
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
    paddingVertical: 12,
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
