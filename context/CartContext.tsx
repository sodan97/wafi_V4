
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useProduct } from './ProductContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  isLoadingCart: boolean;
  cartError: Error | string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'wafi-cart';

const loadStoredCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(loadStoredCart);
  const [isLoadingCart, setIsLoadingCart] = useState<boolean>(false);
  const [cartError, setCartError] = useState<Error | string | null>(null);
  const { products } = useProduct();

  // Le panier survit au rechargement de la page
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Stockage indisponible (navigation privée) : le panier reste en mémoire
    }
  }, [cartItems]);

  // Synchronise prix et stock avec le catalogue (un prix a pu changer depuis l'ajout)
  useEffect(() => {
    if (products.length === 0) return;
    setCartItems(prev => {
      let changed = false;
      const next = prev.flatMap(item => {
        const fresh = products.find(p => p.id === item.id);
        if (!fresh || fresh.status !== 'active' || fresh.stock <= 0) {
          changed = true;
          return [];
        }
        const quantity = Math.min(item.quantity, fresh.stock);
        if (fresh.price !== item.price || fresh.stock !== item.stock || quantity !== item.quantity) {
          changed = true;
          return [{ ...item, ...fresh, quantity }];
        }
        return [item];
      });
      return changed ? next : prev;
    });
  }, [products]);

  // Assuming cart is client-side until checkout, no initial fetch needed.
  // If cart were server-persistent, a useEffect with fetchCart() would go here.

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartError(null);
    try {
      if (product.stock < quantity) {
        console.warn(`Cannot add ${quantity} of product ${product.id}. Insufficient stock.`);
        return;
      }

      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === product.id);
        if (existingItem) {
          // Déjà dans le panier : on augmente la quantité, sans dépasser le stock
          const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
          return prevItems.map(item => item.id === product.id ? { ...item, quantity: newQuantity } : item);
        } else {
          return [...prevItems, { ...product, quantity: quantity }];
        }
      });
    } catch (error) {
      console.error("Failed to add item to cart", error);
      setCartError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const removeFromCart = (productId: string) => {
    setCartError(null);
    try {
      setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    } catch (error) {
      console.error("Failed to remove item from cart", error);
      setCartError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartError(null);
    try {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
        )
      );
    } catch (error) {
      console.error("Failed to update cart item quantity", error);
      setCartError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, isLoadingCart, cartError }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
