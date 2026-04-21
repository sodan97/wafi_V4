import React from 'react';
import { useFavorites } from '../context/FavoriteContext';
import { useProduct } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface FavoritesPageProps {
  onProductSelect: (id: string) => void;
  onNotifyMeClick: (product: Product) => void;
  onBack: () => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ onProductSelect, onNotifyMeClick, onBack }) => {
  const { favorites, isLoadingFavorites } = useFavorites();
  const { products } = useProduct();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">Vous devez être connecté pour voir vos favoris.</p>
      </div>
    );
  }

  console.log('Favoris dans FavoritesPage:', favorites);
  console.log('Produits disponibles:', products);

  // Récupérer les produits favoris complets
  const favoriteProducts = favorites
    .map(fav => {
      // Si productId est un objet (produit populé), on l'utilise directement
      if (typeof fav.productId === 'object' && fav.productId !== null) {
        const product = fav.productId as any;
        return products.find(p => p.id === product.id);
      }
      // Sinon, c'est un nombre, on cherche le produit
      return products.find(p => p.id === fav.productId);
    })
    .filter((p): p is Product => p !== undefined && p.status === 'active');

  console.log('Produits favoris filtrés:', favoriteProducts);

  if (isLoadingFavorites) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
        <p className="mt-4 text-gray-600">Chargement de vos favoris...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">❤️ Mes Favoris</h1>
            <p className="text-gray-600">
              {favoriteProducts.length === 0
                ? 'Aucun produit favori pour le moment'
                : `${favoriteProducts.length} produit${favoriteProducts.length > 1 ? 's' : ''} favori${favoriteProducts.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
          >
            ← Retour
          </button>
        </div>

        {favoriteProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun favori</h2>
            <p className="text-gray-600 mb-6">
              Commencez à ajouter des produits à vos favoris en cliquant sur le cœur !
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors"
            >
              Découvrir nos produits
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {favoriteProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onProductSelect={onProductSelect}
                onNotifyMeClick={onNotifyMeClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
