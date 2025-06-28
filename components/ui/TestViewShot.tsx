import React, { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';

export const TestViewShot: React.FC = () => {
  const viewShotRef = useRef<ViewShot | null>(null);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const handleCapture = async () => {
    console.log('Starting capture test...');
    try {
      if (!viewShotRef.current) {
        console.error('Ref not available');
        return;
      }

      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
      });

      console.log('Captured:', uri);
      setCapturedUri(uri);
    } catch (error) {
      console.error('Capture failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={styles.viewShot}>
        <View style={styles.content}>
          <Text style={styles.text}>Test ViewShot</Text>
          <View style={styles.box} />
        </View>
      </ViewShot>

      <Button title="Capture" onPress={handleCapture} />

      {capturedUri && (
        <Image source={{ uri: capturedUri }} style={styles.preview} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  viewShot: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    marginBottom: 10,
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: 'blue',
  },
  preview: {
    width: 200,
    height: 200,
    marginTop: 20,
  },
});
