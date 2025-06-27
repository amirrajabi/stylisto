import { configureStore } from '@reduxjs/toolkit';
import virtualTryOnReducer from './virtualTryOnSlice';
import wardrobeReducer from './wardrobeSlice';

export const store = configureStore({
  reducer: {
    wardrobe: wardrobeReducer,
    virtualTryOn: virtualTryOnReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'wardrobe/addItem',
          'wardrobe/updateItem',
          'wardrobe/addOutfit',
          'wardrobe/updateOutfit',
          'virtualTryOn/setCurrentOutfit',
          'virtualTryOn/completeProcessing',
        ],
        ignoredPaths: [
          'wardrobe.items',
          'wardrobe.outfits',
          'virtualTryOn.currentOutfitItems',
          'virtualTryOn.history',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
