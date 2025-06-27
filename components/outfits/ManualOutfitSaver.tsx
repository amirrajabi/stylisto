import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import {
  OutfitScoreContext,
  useOutfitScoring,
} from '../../hooks/useOutfitScoring';
import { OutfitService } from '../../lib/outfitService';
import { ClothingItem, Occasion, Season } from '../../types/wardrobe';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface ManualOutfitSaverProps {
  visible: boolean;
  onClose: () => void;
  items: ClothingItem[];
  onSaved?: (outfitId: string) => void;
  context?: OutfitScoreContext;
}

export const ManualOutfitSaver: React.FC<ManualOutfitSaverProps> = ({
  visible,
  onClose,
  items,
  onSaved,
  context,
}) => {
  const [outfitName, setOutfitName] = useState('');
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { calculateDetailedScore, formatScoreForDatabase } = useOutfitScoring();

  const handleSave = useCallback(async () => {
    if (!outfitName.trim()) {
      Alert.alert('Error', 'Please enter an outfit name');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the outfit');
      return;
    }

    setIsSaving(true);

    try {
      const scoreData = calculateDetailedScore(items, context);
      const formattedScore = formatScoreForDatabase(scoreData);

      const outfitId = await OutfitService.saveManualOutfit(
        outfitName.trim(),
        items,
        occasions.map(o => o.toString()),
        seasons.map(s => s.toString()),
        notes.trim(),
        formattedScore,
        onSaved
      );

      Alert.alert('Success', `Outfit "${outfitName}" saved successfully!`, [
        {
          text: 'OK',
          onPress: () => {
            setOutfitName('');
            setOccasions([]);
            setSeasons([]);
            setNotes('');
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving outfit:', error);
      Alert.alert('Error', 'Failed to save outfit. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSaving(false);
    }
  }, [
    outfitName,
    items,
    occasions,
    seasons,
    notes,
    context,
    calculateDetailedScore,
    formatScoreForDatabase,
    onSaved,
    onClose,
  ]);

  return (
    <Modal visible={visible} onClose={onClose} title="Save Outfit">
      <View style={{ gap: 16 }}>
        <Input
          placeholder="Outfit name"
          value={outfitName}
          onChangeText={setOutfitName}
          autoFocus
        />

        <Input
          placeholder="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <Text style={{ fontSize: 14, color: '#666' }}>
          {items.length} item{items.length !== 1 ? 's' : ''} selected
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={{ flex: 1 }}
          />
          <Button
            title={isSaving ? 'Saving...' : 'Save Outfit'}
            onPress={handleSave}
            disabled={isSaving || !outfitName.trim() || items.length === 0}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Modal>
  );
};
