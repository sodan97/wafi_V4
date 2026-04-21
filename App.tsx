import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CartView from './components/CartView';
import ProductDetailPage from './components/ProductDetailPage';
import FavoritesPage from './components/FavoritesPage';
import { Product } from './types';
import HeroStatic from './components/HeroStatic';
import AllProductsView from './components/AllProductsView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminPage from './components/AdminPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import NotificationOptionsModal from './components/NotificationOptionsModal';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';
import { useReservation } from './context/ReservationContext';
import NavigationControls from './components/NavigationControls';

export type View = 'products' | 'cart' | 'login' | 'register' | 'admin' | 'orders' | 'favorites';

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

  const { currentUser } = useAuth();
  const reservationContext = useReservation();
  const prevUserRef = useRef(currentUser);

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
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(location);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prevIndex => prevIndex - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prevIndex => prevIndex + 1);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

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
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 text-gray-800">
      <Header setView={setView} onLogoClick={handleLogoClick} />
      <main className="container mx-auto px-4 py-8">
        {!selectedProductId && (
             <NavigationControls
                onBack={goBack}
                onForward={goForward}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
             />
        )}
        {renderContent()}
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
