import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ClothingItem } from '../types/wardrobe';

export interface VirtualTryOnState {
  userFullBodyImageUrl: string | null;
  currentOutfitId: string | null;
  currentOutfitItems: ClothingItem[];
  currentOutfitName: string | null;
  isProcessing: boolean;
  lastGeneratedImageUrl: string | null;
  lastGeneratedPrompt: string | null;
  processingPhase:
    | 'idle'
    | 'input_analysis'
    | 'ai_styling'
    | 'api_transmission'
    | 'output_delivery'
    | 'completed'
    | 'error';
  processingProgress: number;
  processingMessage: string;
  error: string | null;
  history: VirtualTryOnHistory[];
}

export interface VirtualTryOnHistory {
  id: string;
  outfitId: string;
  outfitName: string;
  outfitItems: ClothingItem[];
  userImageUrl: string;
  generatedImageUrl: string;
  timestamp: string;
  processingTime: number;
  prompt?: string;
}

const initialState: VirtualTryOnState = {
  userFullBodyImageUrl: null,
  currentOutfitId: null,
  currentOutfitItems: [],
  currentOutfitName: null,
  isProcessing: false,
  lastGeneratedImageUrl: null,
  lastGeneratedPrompt: null,
  processingPhase: 'idle',
  processingProgress: 0,
  processingMessage: '',
  error: null,
  history: [],
};

const virtualTryOnSlice = createSlice({
  name: 'virtualTryOn',
  initialState,
  reducers: {
    setUserFullBodyImage: (state, action: PayloadAction<string | null>) => {
      state.userFullBodyImageUrl = action.payload;
    },

    setCurrentOutfit: (
      state,
      action: PayloadAction<{
        outfitId: string;
        outfitName: string;
        items: ClothingItem[];
      }>
    ) => {
      state.currentOutfitId = action.payload.outfitId;
      state.currentOutfitName = action.payload.outfitName;
      state.currentOutfitItems = action.payload.items;
    },

    clearCurrentOutfit: state => {
      state.currentOutfitId = null;
      state.currentOutfitName = null;
      state.currentOutfitItems = [];
    },

    startProcessing: state => {
      state.isProcessing = true;
      state.processingPhase = 'input_analysis';
      state.processingProgress = 0;
      state.processingMessage = 'Starting virtual try-on...';
      state.error = null;
    },

    updateProcessingState: (
      state,
      action: PayloadAction<{
        phase: VirtualTryOnState['processingPhase'];
        progress: number;
        message: string;
      }>
    ) => {
      state.processingPhase = action.payload.phase;
      state.processingProgress = action.payload.progress;
      state.processingMessage = action.payload.message;
    },

    completeProcessing: (
      state,
      action: PayloadAction<{
        generatedImageUrl: string;
        processingTime: number;
        prompt: string;
      }>
    ) => {
      state.isProcessing = false;
      state.processingPhase = 'completed';
      state.processingProgress = 100;
      state.processingMessage = 'Virtual try-on completed successfully!';
      state.lastGeneratedImageUrl = action.payload.generatedImageUrl;
      state.lastGeneratedPrompt = action.payload.prompt;

      // Add to history if we have all required data
      if (
        state.currentOutfitId &&
        state.currentOutfitName &&
        state.userFullBodyImageUrl
      ) {
        const historyEntry: VirtualTryOnHistory = {
          id: `${state.currentOutfitId}_${Date.now()}`,
          outfitId: state.currentOutfitId,
          outfitName: state.currentOutfitName,
          outfitItems: [...state.currentOutfitItems],
          userImageUrl: state.userFullBodyImageUrl,
          generatedImageUrl: action.payload.generatedImageUrl,
          timestamp: new Date().toISOString(),
          processingTime: action.payload.processingTime,
          prompt: action.payload.prompt,
        };

        // Add to beginning of history and keep only last 10 entries
        state.history.unshift(historyEntry);
        state.history = state.history.slice(0, 10);
      }
    },

    setProcessingError: (state, action: PayloadAction<string>) => {
      state.isProcessing = false;
      state.processingPhase = 'error';
      state.processingProgress = 0;
      state.error = action.payload;
      state.processingMessage = `Error: ${action.payload}`;
    },

    clearError: state => {
      state.error = null;
      if (state.processingPhase === 'error') {
        state.processingPhase = 'idle';
        state.processingMessage = '';
      }
    },

    clearHistory: state => {
      state.history = [];
    },

    removeHistoryEntry: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(
        entry => entry.id !== action.payload
      );
    },

    reset: state => {
      return {
        ...initialState,
        userFullBodyImageUrl: state.userFullBodyImageUrl,
      };
    },
  },
});

export const {
  setUserFullBodyImage,
  setCurrentOutfit,
  clearCurrentOutfit,
  startProcessing,
  updateProcessingState,
  completeProcessing,
  setProcessingError,
  clearError,
  clearHistory,
  removeHistoryEntry,
  reset,
} = virtualTryOnSlice.actions;

export default virtualTryOnSlice.reducer;
