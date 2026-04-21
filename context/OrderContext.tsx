import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Order } from '../types';
import { useAuth } from './AuthContext';

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

const API_BASE_URL = '/api';

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
      let url = `${API_BASE_URL}/orders`;

      if (currentUser?.role !== 'admin') {
        url = `${API_BASE_URL}/orders/myorders?userId=${currentUser?.id}`;
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched orders data:', data);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error("Error fetching orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newOrder = await response.json();
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      return newOrder;
    } catch (err: any) {
      setError(err.message || 'Failed to add order');
      console.error("Error adding order:", err);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, handledByName?: string) => {
    const originalOrders = orders;
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    setError(null);

    try {
      console.log(`Updating order ID: ${orderId} with status: ${newStatus}`);
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          status: newStatus,
          handledBy: currentUser?.id?.toString() || '',
          handledByName: handledByName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedOrderFromServer = await response.json();
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? updatedOrderFromServer : order
        )
      );
    } catch (err: any) {
      setOrders(originalOrders);
      setError(err.message || 'Failed to update order status');
      console.error("Error updating order status:", err);
    }
  };

  const deleteOrder = async (orderId: string) => {
    const originalOrders = orders;
    setOrders(orders.filter(order => order.id !== orderId));
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err: any) {
      setOrders(originalOrders);
      setError(err.message || 'Failed to delete order');
      console.error("Error deleting order:", err);
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