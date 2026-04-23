import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { View } from '../App';

interface HeaderProps {
  setView: (view: View) => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ setView, onLogoClick }) => {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();

  return (
      <header className="bg-teal-600 shadow-lg h-16 md:h-20 pl-0 pr-3 md:pr-6 flex justify-between items-center overflow-hidden fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center h-full">
        <button onClick={onLogoClick} className="h-full flex items-center">
          <img
            src="/logo.png"
            alt="Wafi Logo"
            className="block h-full max-h-full w-auto object-contain"
          />
        </button>

        <nav className="space-x-4 hidden md:flex ml-4">
          <button onClick={() => setView('products')} className="text-white font-semibold hover:scale-110 transition-transform px-3 py-2 rounded-full hover:bg-white/20">🎮 Produits</button>
          <button onClick={() => setView('cart')} className="text-white font-semibold hover:scale-110 transition-transform px-3 py-2 rounded-full hover:bg-white/20">🛒 Panier</button>
          {currentUser && currentUser.role !== 'admin' && (
            <button onClick={() => setView('favorites')} className="text-white font-semibold hover:scale-110 transition-transform px-3 py-2 rounded-full hover:bg-white/20">⭐ Favoris</button>
          )}
          {currentUser?.role === 'admin' && <button onClick={() => setView('admin')} className="text-white font-semibold hover:scale-110 transition-transform px-3 py-2 rounded-full hover:bg-white/20">👨‍💼 Admin</button>}
          {currentUser && <button onClick={() => setView('orders')} className="text-white font-semibold hover:scale-110 transition-transform px-3 py-2 rounded-full hover:bg-white/20">📦 Commandes</button>}
        </nav>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
        <h1 className="text-white text-lg md:text-2xl font-bold whitespace-nowrap">Bienvenu chez Wafi</h1>
      </div>
      <div className="flex items-center space-x-1 md:space-x-4">
        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={() => setView('favorites')}
            className="flex items-center space-x-1 text-white hover:scale-110 transition-transform p-2 relative"
            aria-label="Favoris"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="hidden lg:inline font-semibold">Favoris</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] animate-pulse">
                {favorites.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setView('cart')}
          className="flex items-center space-x-1 text-white hover:scale-110 transition-transform p-2 relative"
          aria-label="Panier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9m0 0V13m0 0h2.5" />
          </svg>
          <span className="hidden lg:inline font-semibold">Panier</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] animate-pulse">
              {itemCount}
            </span>
          )}
        </button>
        {currentUser ? (
          <>
            <span className="text-xs md:text-sm text-white font-medium hidden sm:inline">
              Salut, <span className="font-bold">{currentUser.firstName}</span>! 👋
            </span>
            <button onClick={logout} className="text-white font-semibold hover:scale-110 transition-transform px-2 md:px-3 py-1 md:py-2 text-sm rounded-full bg-white/20">Déconnexion</button>
          </>
        ) : (
          <>
            <button onClick={() => setView('login')} className="text-white font-semibold hover:scale-110 transition-transform px-2 md:px-3 py-1 md:py-2 text-sm rounded-full bg-white/20">Connexion</button>
            <button onClick={() => setView('register')} className="text-white font-semibold hover:scale-110 transition-transform px-2 md:px-3 py-1 md:py-2 text-sm rounded-full bg-white/20 hidden sm:inline-block">Inscription</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
