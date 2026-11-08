import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Header from './components/Header';
import ProductDetailPage from './components/ProductDetailPage';
import FavoritesPage from './components/FavoritesPage';
import { Product } from './types';
import HeroStatic, { HowToOrder } from './components/HeroStatic';
import AllProductsView from './components/AllProductsView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
// Chargée à la demande : les clients ne téléchargent pas le code admin (ni la librairie Excel)
const AdminPage = lazy(() => import('./components/AdminPage'));
// Panier/commande et profil : chargés à la demande (ils contiennent la liste des indicatifs de tous les pays)
const CartView = lazy(() => import('./components/CartView'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
import OrderHistoryPage from './components/OrderHistoryPage';
import NotificationOptionsModal from './components/NotificationOptionsModal';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useReservation } from './context/ReservationContext';

export type View = 'products' | 'cart' | 'login' | 'register' | 'admin' | 'orders' | 'favorites' | 'profile';

interface HistoryState {
  view: View;
}

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryState[]>([{ view: 'products' }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [notificationOptionsProduct, setNotificationOptionsProduct] = useState<Product | null>(null);

  const handleNotifyMeClick = (product: Product) => {
    setNotificationOptionsProduct(product);
  };
  const [pendingReservationProductId, setPendingReservationProductId] = useState<string | null>(null);
  // Message affiché en haut de page après une action importante (ex. suppression du compte)
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const { currentUser } = useAuth();
  const reservationContext = useReservation();
  const prevUserRef = useRef(currentUser);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      setSelectedProductId(productId);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    if (!prevUser && currentUser) {
      // On login, reset history
      const initialView = currentUser.role === 'admin' ? 'admin' : 'products';
      const initialHistoryState: HistoryState = { view: initialView };
      setHistory([initialHistoryState]);
      setHistoryIndex(0);

      if (pendingReservationProductId) {
        reservationContext.addReservation(pendingReservationProductId, String(currentUser.id));
        setPendingReservationProductId(null);
      }
    } else if (prevUser && !currentUser) {
      // On logout, reset history
      const initialHistoryState: HistoryState = { view: 'products' };
      setHistory([initialHistoryState]);
      setHistoryIndex(0);
    }
    prevUserRef.current = currentUser;
  }, [currentUser, pendingReservationProductId, reservationContext]);

  const { view } = history[historyIndex] || { view: 'products' };

  const navigate = (location: HistoryState) => {
    const currentLocation = history[historyIndex];
    if (location.view === currentLocation.view) {
      return;
    }
    setFlashMessage(null);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(location);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Le bouton « retour » du téléphone/navigateur revient à la page précédente du site
    window.history.pushState({ wafi: true }, '');
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prevIndex => prevIndex - 1);
    }
  };

  // Bouton « retour » du navigateur : ferme la fiche produit, sinon revient à la vue précédente
  const popStateRef = useRef<() => void>(() => {});
  popStateRef.current = () => {
    if (selectedProductId) {
      setSelectedProductId(null);
    } else {
      goBack();
    }
  };
  useEffect(() => {
    const onPopState = () => popStateRef.current();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setView = (view: View) => {
    setSelectedProductId(null); // Fix: Always clear product detail view when changing main view
    navigate({ view });
  };

  const handleLogoClick = () => {
    setSelectedProductId(null);
     if (currentUser?.role === 'admin') {
      navigate({ view: 'admin' });
    } else {
      navigate({ view: 'products' });
    }
  };

  const navigateToProductPage = (id: string) => {
    setSelectedProductId(id);
    window.history.pushState({ wafi: true }, '');
    window.scrollTo({ top: 0 });
  };

  const handleContinueShopping = () => {
    navigate({ view: 'products' });
  };

  const renderContent = () => {
    if (selectedProductId) {
      return <ProductDetailPage productId={selectedProductId} onBack={() => setSelectedProductId(null)} navigateToProductPage={navigateToProductPage} />;
    }

    switch(view) {
      case 'login':
        return <LoginPage setView={setView} />;
      case 'register':
        return <RegisterPage setView={setView} />;
      case 'admin':
        return currentUser?.role === 'admin' ? <AdminPage /> : <p>Accès non autorisé.</p>;
      case 'orders':
        return currentUser ? <OrderHistoryPage /> : <LoginPage setView={setView} />;
      case 'profile':
        return currentUser ? (
          <ProfilePage
            onAccountDeleted={() => {
              setFlashMessage('Votre compte a été supprimé. Merci d’avoir fait confiance à WAFI.');
              window.scrollTo({ top: 0 });
            }}
          />
        ) : <LoginPage setView={setView} />;
      case 'favorites':
        return currentUser ? (
          <FavoritesPage
            onProductSelect={navigateToProductPage}
            onNotifyMeClick={handleNotifyMeClick}
            onBack={() => setView('products')}
          />
        ) : <LoginPage setView={setView} />;
      case 'cart':
        if (currentUser?.role === 'admin') {
            return <p className="text-center text-xl">L'accès au panier est réservé aux clients.</p>;
        }
        return <CartView onContinueShopping={handleContinueShopping} />;
      case 'products':
      default:
        if (currentUser?.role === 'admin') {
            return <AdminPage />;
        }
        return (
          <>
            <HeroStatic />
            <AllProductsView onProductSelect={navigateToProductPage} onNotifyMeClick={handleNotifyMeClick} />
            <HowToOrder />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-ink-900">
      <Header setView={setView} onLogoClick={handleLogoClick} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-10">
        {flashMessage && (
          <div role="status" className="mb-6 flex items-start justify-between gap-4 rounded-2xl bg-brand-50 px-5 py-4 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <span>{flashMessage}</span>
            <button onClick={() => setFlashMessage(null)} className="shrink-0 font-semibold hover:underline" aria-label="Fermer le message">Fermer</button>
          </div>
        )}
        <Suspense fallback={<div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" /></div>}>
          {renderContent()}
        </Suspense>
      </main>
      <Footer />
      {notificationOptionsProduct && (
        <NotificationOptionsModal
          product={notificationOptionsProduct}
          onClose={() => setNotificationOptionsProduct(null)}
          setView={setView}
          setPendingReservation={setPendingReservationProductId}
        />
      )}
    </div>
  );
};

export default App;
