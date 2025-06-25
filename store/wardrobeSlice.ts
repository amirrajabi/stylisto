import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  ClothingItem,
  FilterOptions,
  Outfit,
  SortOptions,
} from '../types/wardrobe';

interface WardrobeState {
  items: ClothingItem[];
  outfits: Outfit[];
  selectedItems: string[];
  filters: FilterOptions;
  sortOptions: SortOptions;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: WardrobeState = {
  items: [],
  outfits: [],
  selectedItems: [],
  filters: {
    categories: [],
    seasons: [],
    occasions: [],
    colors: [],
    brands: [],
    tags: [],
    favorites: false,
  },
  sortOptions: {
    field: 'createdAt',
    direction: 'desc',
  },
  searchQuery: '',
  isLoading: false,
  error: null,
};

const wardrobeSlice = createSlice({
  name: 'wardrobe',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<ClothingItem[]>) => {
      state.items = action.payload;
    },
    addItem: (state, action: PayloadAction<ClothingItem>) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action: PayloadAction<ClothingItem>) => {
      const index = state.items.findIndex(
        item => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.selectedItems = state.selectedItems.filter(
        id => id !== action.payload
      );
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.isFavorite = !item.isFavorite;
      }
    },
    addOutfit: (state, action: PayloadAction<Outfit>) => {
      state.outfits.push(action.payload);
    },
    updateOutfit: (state, action: PayloadAction<Outfit>) => {
      const index = state.outfits.findIndex(
        outfit => outfit.id === action.payload.id
      );
      if (index !== -1) {
        state.outfits[index] = action.payload;
      }
    },
    deleteOutfit: (state, action: PayloadAction<string>) => {
      state.outfits = state.outfits.filter(
        outfit => outfit.id !== action.payload
      );
    },
    toggleOutfitFavorite: (state, action: PayloadAction<string>) => {
      const outfit = state.outfits.find(outfit => outfit.id === action.payload);
      if (outfit) {
        outfit.isFavorite = !outfit.isFavorite;
      }
    },
    selectItem: (state, action: PayloadAction<string>) => {
      if (!state.selectedItems.includes(action.payload)) {
        state.selectedItems.push(action.payload);
      }
    },
    deselectItem: (state, action: PayloadAction<string>) => {
      state.selectedItems = state.selectedItems.filter(
        id => id !== action.payload
      );
    },
    clearSelection: state => {
      state.selectedItems = [];
    },
    setFilters: (state, action: PayloadAction<Partial<FilterOptions>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: state => {
      state.filters = initialState.filters;
    },
    setSortOptions: (state, action: PayloadAction<SortOptions>) => {
      state.sortOptions = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setItems,
  addItem,
  updateItem,
  deleteItem,
  toggleFavorite,
  addOutfit,
  updateOutfit,
  deleteOutfit,
  toggleOutfitFavorite,
  selectItem,
  deselectItem,
  clearSelection,
  setFilters,
  clearFilters,
  setSortOptions,
  setSearchQuery,
  setLoading,
  setError,
} = wardrobeSlice.actions;

export default wardrobeSlice.reducer;
