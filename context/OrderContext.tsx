import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Order } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../src/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  Query,
  DocumentData,
} from 'firebase/firestore';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Promise<Order | undefined>;
  isLoading: boolean;
  error: string | null;
  updateOrderStatus: (orderId: string, newStatus: string, handledByName?: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ordersRef = collection(db, 'orders');
      let q: Query<DocumentData>;

      if (currentUser?.role === 'admin') {
        q = query(ordersRef, orderBy('date', 'desc'));
      } else {
        q = query(ordersRef, where('userId', '==', currentUser?.id), orderBy('date', 'desc'));
      }

      const snapshot = await getDocs(q);
      const data: Order[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data() as Record<string, any>;
        return {
          id: docSnap.id,
          customer: d.customer,
          items: d.items,
          total: d.total,
          userId: d.userId,
          status: d.status,
          date: d.date instanceof Timestamp ? d.date.toDate().toISOString() : d.date,
          handledBy: d.handledBy,
          handledByName: d.handledByName,
        } as Order;
      });

      console.log('Fetched orders data:', data);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const newOrderData = {
        ...orderData,
        status: 'pending',
        date: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrderData);
      const newOrder: Order = { id: docRef.id, ...newOrderData };
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      return newOrder;
    } catch (err: any) {
      setError(err.message || 'Failed to add order');
      console.error('Error adding order:', err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, handledByName?: string) => {
    const originalOrders = orders;
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    setError(null);

    try {
      console.log(`Updating order ID: ${orderId} with status: ${newStatus}`);
      const orderRef = doc(db, 'orders', orderId);
      const updateData = {
        status: newStatus,
        handledBy: currentUser?.id?.toString() || '',
        handledByName: handledByName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
      };

      await updateDoc(orderRef, updateData);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updateData } : order
        )
      );
    } catch (err: any) {
      setOrders(originalOrders);
      setError(err.message || 'Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    const originalOrders = orders;
    setOrders(orders.filter(order => order.id !== orderId));
    setError(null);

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err: any) {
      setOrders(originalOrders);
      setError(err.message || 'Failed to delete order');
      console.error('Error deleting order:', err);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, isLoading, error, updateOrderStatus, fetchOrders, deleteOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
