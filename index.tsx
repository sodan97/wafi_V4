import React from 'react';
import './src/index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { OrderProvider } from './context/OrderContext';
import { ReservationProvider } from './context/ReservationContext';
import { NotificationProvider } from './context/NotificationContext';
import { FavoriteProvider } from './context/FavoriteContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ReservationProvider>
        <NotificationProvider>
          <FavoriteProvider>
            <ProductProvider>
              <OrderProvider>
                <CartProvider>
                  <App />
                </CartProvider>
              </OrderProvider>
            </ProductProvider>
          </FavoriteProvider>
        </NotificationProvider>
      </ReservationProvider>
    </AuthProvider>
  </React.StrictMode>
);