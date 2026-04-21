import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../src/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  stock: number;
  status: string;
}

interface Favorite {
  id: string;
  userId: string;
  productId: string | number;
  product?: Product;
  date: string;
}

interface FavoriteContextType {
  favorites: Favorite[];
  isLoadingFavorites: boolean;
  favoriteError: string | null;
  addFavorite: (productId: string | number) => Promise<void>;
  removeFavorite: (productId: string | number) => Promise<void>;
  isFavorite: (productId: string | number) => boolean;
  toggleFavorite: (productId: string | number) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!currentUser?.id) {
      setFavorites([]);
      return;
    }

    setIsLoadingFavorites(true);
    setFavoriteError(null);
    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', currentUser.id));
      const snapshot = await getDocs(q);

      const normalized: Favorite[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: data.userId,
          productId: typeof data.productId === 'number' ? String(data.productId) : data.productId,
          product: data.product,
          date: data.createdAt ?? new Date().toISOString(),
        };
      });

      setFavorites(normalized);
    } catch (error: any) {
      setFavoriteError(error.message || 'An unknown error occurred');
      console.error('[Favorites] Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      console.debug('[Favorites] currentUser changed, fetching favorites');
      fetchFavorites();
    } else {
      console.debug('[Favorites] currentUser is null, clearing favorites');
      setFavorites([]);
    }
  }, [currentUser, fetchFavorites]);

  const addFavorite = useCallback(async (productId: string | number) => {
    if (!currentUser?.id) {
      alert('Vous devez être connecté pour ajouter des favoris.');
      return;
    }

    const normalizedProductId = typeof productId === 'number' ? String(productId) : productId;

    if (favorites.some(f => f.productId === normalizedProductId)) {
      console.debug('[Favorites] Product already in favorites');
      return;
    }

    const tempFavorite: Favorite = {
      id: `temp-${Date.now()}`,
      userId: currentUser.id,
      productId: normalizedProductId,
      date: new Date().toISOString()
    };
    console.debug('[Favorites] Optimistically adding favorite:', tempFavorite);
    setFavorites(prev => [...prev, tempFavorite]);

    try {
      const docRef = await addDoc(collection(db, 'favorites'), {
        userId: currentUser.id,
        productId: normalizedProductId,
        createdAt: new Date().toISOString()
      });

      setFavorites(prev =>
        prev.map(f =>
          f.id === tempFavorite.id ? { ...f, id: docRef.id } : f
        )
      );
      console.debug('[Favorites] Successfully added favorite, id:', docRef.id);
    } catch (error: any) {
      setFavoriteError(error.message);
      console.error('[Favorites] Error adding favorite:', error);
      setFavorites(prev => prev.filter(f => f.id !== tempFavorite.id));

      if (!error.message?.includes?.('already in favorites')) {
        alert('Erreur lors de l\'ajout aux favoris: ' + error.message);
      }
    }
  }, [currentUser, favorites]);

  const removeFavorite = useCallback(async (productId: string | number) => {
    if (!currentUser?.id) {
      console.debug('[Favorites] removeFavorite called without a currentUser');
      return;
    }

    const normalizedProductId = typeof productId === 'number' ? String(productId) : productId;
    const favoriteToRemove = favorites.find(f => f.productId === normalizedProductId);

    if (!favoriteToRemove) {
      console.debug('[Favorites] No favorite found for productId:', productId);
      return;
    }

    const originalFavorites = [...favorites];
    console.debug('[Favorites] Optimistically removing favorite for productId:', productId);
    setFavorites(prev => prev.filter(f => f.productId !== normalizedProductId));

    try {
      await deleteDoc(doc(db, 'favorites', favoriteToRemove.id));
      console.debug('[Favorites] Successfully removed favorite for favoriteId:', favoriteToRemove.id);
    } catch (error: any) {
      setFavoriteError(error.message);
      console.error('[Favorites] Error removing favorite:', error);
      setFavorites(originalFavorites);
      alert('Erreur lors de la suppression du favori.');
    }
  }, [currentUser, favorites]);

  const isFavorite = useCallback((productId: string | number): boolean => {
    const normalizedProductId = typeof productId === 'number' ? String(productId) : productId;
    return favorites.some(f => f.productId === normalizedProductId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (productId: string | number) => {
    console.debug('[Favorites] toggleFavorite called for productId:', productId);
    if (isFavorite(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        isLoadingFavorites,
        favoriteError,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        fetchFavorites,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = (): FavoriteContextType => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
};
