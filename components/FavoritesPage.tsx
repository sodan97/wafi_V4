import React from 'react';
import { useFavorites } from '../context/FavoriteContext';
import { useProduct } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { HeartIcon } from './icons';

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
        <p className="text-xl text-ink-500">Vous devez être connecté pour voir vos favoris.</p>
      </div>
    );
  }

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

  if (isLoadingFavorites) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <p className="mt-4 text-ink-500">Chargement de vos favoris...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Mes favoris</h1>
      <p className="mt-1 text-ink-500">
        {favoriteProducts.length === 0
          ? 'Gardez ici les jouets qui vous plaisent.'
          : `${favoriteProducts.length} jouet${favoriteProducts.length > 1 ? 's' : ''} mis de côté`}
      </p>

      {favoriteProducts.length === 0 ? (
        <div className="mt-6 rounded-[2rem] bg-white px-6 py-16 text-center ring-1 ring-ink-900/5">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tangerine-100 text-tangerine-500">
            <HeartIcon className="h-8 w-8" />
          </span>
          <p className="mt-5 font-display text-xl font-semibold text-ink-900">Aucun favori pour l’instant</p>
          <p className="mt-2 text-ink-500">Touchez le cœur sur un jouet pour le retrouver ici.</p>
          <button onClick={onBack} className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
            Découvrir les jouets
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
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
  );
};

export default FavoritesPage;
