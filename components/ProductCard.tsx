import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useReservation } from '../context/ReservationContext';
import { useFavorites } from '../context/FavoriteContext';

interface ProductCardProps {
  product: Product;
  onProductSelect: (id: string) => void;
  onNotifyMeClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductSelect, onNotifyMeClick }) => {
  const { addToCart, cartItems } = useCart();
  const { currentUser } = useAuth();
  const { addReservation, hasUserReserved } = useReservation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdded, setIsAdded] = useState(false);

  const isInCart = cartItems.some(item => item.id === product.id);
  const isProductFavorite = isFavorite(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleNotifyClick = () => {
    if (currentUser && !hasUserReserved(product.id, String(currentUser.id))) {
      addReservation(product.id, String(currentUser.id));
    }
    onNotifyMeClick(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la navigation vers la page de détail
    toggleFavorite(product.id);
  };

  const isOutOfStock = product.stock <= 0;
  const canAddToCart = !isOutOfStock;

  const userHasReserved = currentUser ? hasUserReserved(product.id, String(currentUser.id)) : false;

  const renderButton = () => {
    if (isOutOfStock) {
      if (userHasReserved) {
        return (
          <button
            onClick={() => onNotifyMeClick(product)}
            className="px-4 py-2 rounded-md font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
          >
            Réservation confirmée
          </button>
        );
      }
      return (
        <button onClick={handleNotifyClick} className="px-4 py-2 rounded-md font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors">
          Me notifier
        </button>
      );
    }

    return (
      <button
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={`px-4 py-2 rounded-md font-semibold text-white transition-all duration-300 ${isAdded || isInCart ? 'bg-green-500' : 'bg-gray-800 hover:bg-rose-500'} disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {isAdded || isInCart ? 'Ajouté !' : 'Ajouter'}
      </button>
    );
  };

  const fallbackImage = product.imageUrls?.[0] || (product as any).imageUrl || '/placeholder.png';

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 group flex flex-col ${isOutOfStock ? 'opacity-90' : ''}`}>
      <div
        className="relative block bg-white cursor-pointer"
        onClick={() => onProductSelect(product.id)}
        role="button"
        aria-label={`Voir les détails pour ${product.name}`}
      >
        <div
          className="w-full h-64 flex items-center justify-center overflow-hidden relative"
          style={{ backgroundImage: `url(${fallbackImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 backdrop-blur-md" style={{ backgroundImage: `url(${fallbackImage})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', transform: 'scale(1.1)' }} />
          <img src={fallbackImage} alt={product.name} className="relative z-10 w-full h-full object-contain" />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
        {isOutOfStock && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">RUPTURE DE STOCK</div>
        )}

        {/* Bouton Favori en haut à gauche */}
        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={handleToggleFavorite}
            className="absolute top-4 left-4 transition-all duration-300 z-20"
            title={isProductFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <span className="text-3xl drop-shadow-lg">{isProductFavorite ? '❤️' : '🤍'}</span>
          </button>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
        <p className="text-gray-600 mb-4 h-12 overflow-hidden flex-grow">{product.description.substring(0, 100)}...</p>
        <div className="flex justify-between items-center mt-auto pt-4">
          <p className="text-2xl font-bold text-rose-500">{product.price.toLocaleString('fr-FR')} FCFA</p>
          {currentUser?.role !== 'admin' && renderButton()}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;