import { configureStore } from '@reduxjs/toolkit';
import wardrobeReducer from './wardrobeSlice';

export const store = configureStore({
  reducer: {
    wardrobe: wardrobeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['wardrobe/addItem', 'wardrobe/updateItem', 'wardrobe/addOutfit', 'wardrobe/updateOutfit'],
        ignoredPaths: ['wardrobe.items', 'wardrobe.outfits'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;