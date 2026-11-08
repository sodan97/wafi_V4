import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { View } from '../App';
import Logo from './Logo';
import { CartIcon, HeartIcon, UserIcon, MenuIcon, CloseIcon, PackageIcon, LogOutIcon, DashboardIcon, TruckIcon } from './icons';

interface HeaderProps {
  setView: (view: View) => void;
  onLogoClick: () => void;
}

const Badge: React.FC<{ count: number }> = ({ count }) =>
  count > 0 ? (
    <span key={count} className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-tangerine-500 px-1 text-[11px] font-bold text-white ring-2 ring-white animate-pop">
      {count}
    </span>
  ) : null;

const Header: React.FC<HeaderProps> = ({ setView, onLogoClick }) => {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const isClient = !!currentUser && !isAdmin;

  const go = (view: View) => {
    setView(view);
    setMenuOpen(false);
  };

  const navLink = 'rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700';
  const iconButton = 'relative flex h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700';

  return (
    <>
      <div className="bg-brand-700 text-white">
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium sm:text-sm">
          <TruckIcon className="h-4 w-4 shrink-0" />
          <span>
            Livraison partout à Dakar · Régions : écrivez-nous<span className="hidden sm:inline"> · Commande via WhatsApp</span>
          </span>
        </p>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink-900/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20">
          <button onClick={() => { onLogoClick(); setMenuOpen(false); }} className="shrink-0" aria-label="Accueil WAFI">
            <Logo className="h-11 w-auto md:h-14" />
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            <button onClick={() => go('products')} className={navLink}>Boutique</button>
            {isClient && <button onClick={() => go('favorites')} className={navLink}>Favoris</button>}
            {currentUser && <button onClick={() => go('orders')} className={navLink}>Mes commandes</button>}
            {isAdmin && <button onClick={() => go('admin')} className={navLink}>Administration</button>}
          </nav>

          <div className="flex items-center gap-1">
            {isClient && (
              <button onClick={() => go('favorites')} className={`${iconButton} hidden sm:flex`} aria-label={`Favoris (${favorites.length})`}>
                <HeartIcon className="h-6 w-6" />
                <Badge count={favorites.length} />
              </button>
            )}

            {!isAdmin && (
              <button onClick={() => go('cart')} className={iconButton} aria-label={`Panier (${itemCount} article${itemCount > 1 ? 's' : ''})`}>
                <CartIcon className="h-6 w-6" />
                <Badge count={itemCount} />
              </button>
            )}

            {currentUser ? (
              <div className="hidden items-center gap-2 md:flex">
                <button onClick={() => go('profile')} className="ml-2 flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700 lg:pr-3" aria-label="Mon profil" title="Mon profil">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sun-200 font-display text-base font-semibold text-ink-900">
                    {currentUser.firstName?.charAt(0).toUpperCase() || '?'}
                  </span>
                  <span className="hidden lg:inline">{currentUser.firstName || 'Mon profil'}</span>
                </button>
                <button onClick={logout} className={iconButton} aria-label="Se déconnecter" title="Se déconnecter">
                  <LogOutIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <button onClick={() => go('login')} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-brand-50">Connexion</button>
                <button onClick={() => go('register')} className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">Créer un compte</button>
              </div>
            )}

            <button onClick={() => setMenuOpen(o => !o)} className={`${iconButton} md:hidden`} aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen}>
              {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-ink-900/5 bg-white px-4 pb-5 pt-2 shadow-lg md:hidden animate-fade-in" aria-label="Menu mobile">
            {currentUser && (
              <p className="px-3 py-3 text-sm text-ink-500">Bonjour <span className="font-semibold text-ink-900">{currentUser.firstName}</span></p>
            )}
            <ul className="space-y-1">
              <li><button onClick={() => go('products')} className="w-full rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50">Boutique</button></li>
              {!isAdmin && (
                <li><button onClick={() => go('cart')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50"><CartIcon className="h-5 w-5 text-brand-600" />Panier {itemCount > 0 && `(${itemCount})`}</button></li>
              )}
              {isClient && (
                <li><button onClick={() => go('favorites')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50"><HeartIcon className="h-5 w-5 text-brand-600" />Favoris {favorites.length > 0 && `(${favorites.length})`}</button></li>
              )}
              {currentUser && (
                <li><button onClick={() => go('orders')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50"><PackageIcon className="h-5 w-5 text-brand-600" />Mes commandes</button></li>
              )}
              {currentUser && (
                <li><button onClick={() => go('profile')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50"><UserIcon className="h-5 w-5 text-brand-600" />Mon profil</button></li>
              )}
              {isAdmin && (
                <li><button onClick={() => go('admin')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-ink-900 hover:bg-brand-50"><DashboardIcon className="h-5 w-5 text-brand-600" />Administration</button></li>
              )}
            </ul>
            <div className="mt-4 border-t border-ink-900/5 pt-4">
              {currentUser ? (
                <button onClick={() => { logout(); setMenuOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-full border border-ink-900/10 py-3 font-semibold text-ink-700">
                  <LogOutIcon className="h-5 w-5" />Se déconnecter
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => go('login')} className="flex items-center justify-center gap-2 rounded-full border border-ink-900/10 py-3 font-semibold text-ink-900"><UserIcon className="h-5 w-5" />Connexion</button>
                  <button onClick={() => go('register')} className="rounded-full bg-brand-600 py-3 font-semibold text-white">Créer un compte</button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default Header;
