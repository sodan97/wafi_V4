import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useReservation } from '../context/ReservationContext';
import { useFavorites } from '../context/FavoriteContext';
import { CartIcon, CheckIcon, HeartIcon, BellIcon } from './icons';

interface ProductCardProps {
  product: Product;
  onProductSelect: (id: string) => void;
  onNotifyMeClick: (product: Product) => void;
}

export const formatPrice = (price: number) => `${price.toLocaleString('fr-FR')} F`;

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductSelect, onNotifyMeClick }) => {
  const { addToCart, cartItems } = useCart();
  const { currentUser } = useAuth();
  const { addReservation, hasUserReserved } = useReservation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdded, setIsAdded] = useState(false);

  const isInCart = cartItems.some(item => item.id === product.id);
  const isProductFavorite = isFavorite(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 2;
  const isAdmin = currentUser?.role === 'admin';
  const userHasReserved = currentUser ? hasUserReserved(product.id, String(currentUser.id)) : false;
  const image = product.imageUrls?.[0] || (product as any).imageUrl || '/icon-512.png';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleNotifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser && !userHasReserved) {
      addReservation(product.id, String(currentUser.id));
    }
    onNotifyMeClick(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const renderAction = () => {
    if (isAdmin) return null;
    if (isOutOfStock) {
      return (
        <button
          onClick={handleNotifyClick}
          className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition ${userHasReserved ? 'bg-brand-50 text-brand-700' : 'bg-sun-200 text-ink-900 hover:bg-sun-300'}`}
        >
          {userHasReserved ? <CheckIcon className="h-4 w-4" /> : <BellIcon className="h-4 w-4" />}
          {userHasReserved ? 'Vous serez prévenu' : 'Me prévenir'}
        </button>
      );
    }
    const added = isAdded || isInCart;
    return (
      <button
        onClick={handleAddToCart}
        className={`flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition ${added ? 'bg-brand-700' : 'bg-brand-600 hover:bg-brand-700'}`}
        aria-label={added ? `${product.name} est dans le panier, en ajouter un autre` : `Ajouter ${product.name} au panier`}
      >
        {added ? <CheckIcon className="h-4 w-4" /> : <CartIcon className="h-4 w-4" />}
        {isAdded ? 'Ajouté' : isInCart ? 'Dans le panier' : 'Ajouter'}
      </button>
    );
  };

  return (
    <article
      onClick={() => onProductSelect(product.id)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink-900/5"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-3 sm:p-5">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-contain transition duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
        />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isOutOfStock && <span className="rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white">Épuisé</span>}
          {isLowStock && <span className="rounded-full bg-tangerine-500 px-2.5 py-1 text-[11px] font-semibold text-white">Plus que {product.stock}</span>}
        </div>

        {currentUser && !isAdmin && (
          <button
            onClick={handleToggleFavorite}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-ink-900/5 transition hover:scale-110 ${isProductFavorite ? 'text-tangerine-500' : 'text-ink-500'}`}
            aria-label={isProductFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isProductFavorite}
          >
            <HeartIcon filled={isProductFavorite} className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-ink-900/5 p-3 sm:p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{product.category}</p>
        <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-ink-900 first-letter:uppercase sm:text-base">{product.name}</h3>
        <p className="mt-auto pt-2 font-display text-lg font-semibold text-ink-900 sm:text-xl">{formatPrice(product.price)}</p>
        <div className="mt-2">{renderAction()}</div>
      </div>
    </article>
  );
};

export default ProductCard;
