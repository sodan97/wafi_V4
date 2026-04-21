


import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Reservation } from '../types';
import { useAuth } from './AuthContext';

interface ReservationContextType {
  reservations: Reservation[];
  isLoadingReservations: boolean;
  reservationError: Error | string | null;
  addReservation: (productId: string, userId: string) => Promise<void>;
  hasUserReserved: (productId: string, userId: string) => boolean;
  getReservationsByProduct: (productId: string) => Reservation[];
  removeReservationsForProduct: (productId: string) => Promise<void>;
  fetchReservations: () => Promise<void>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

const API_BASE_URL = '/api';

export const ReservationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [reservationError, setReservationError] = useState<Error | string | null>(null);
  const { currentUser } = useAuth();

  const fetchReservations = useCallback(async () => {
    if (!currentUser) return;

    setIsLoadingReservations(true);
    setReservationError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/mine`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setReservations(data);
    } catch (error: any) {
      setReservationError(error.message || 'An unknown error occurred');
      console.error("Error fetching reservations:", error);
    } finally {
      setIsLoadingReservations(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchReservations();
    }
  }, [currentUser, fetchReservations]);

  const addReservation = useCallback(async (productId: string, userId: string) => {

    let alreadyReserved = false;
    setReservations(prev => {
        alreadyReserved = prev.some(res => res.productId === productId && res.userId === userId);
        if (alreadyReserved) {
            console.log("Reservation already exists in local state. No action taken.");
            return prev;
        }
        const newReservation: Reservation = { productId, userId, date: new Date().toISOString() };
        return [...prev, newReservation];
    });

    if (alreadyReserved) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productId, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchReservations();

    } catch (error: any) {
      setReservationError(error.message);
      console.error("Error adding reservation to backend:", error);
      setReservations(prev => prev.filter(r => r.productId !== productId || r.userId !== userId));
    }
  }, [fetchReservations]);

  const hasUserReserved = useCallback((productId: string, userId: string): boolean => {
    return reservations.some(res => res.productId === productId && res.userId === userId);
  }, [reservations]);

  const getReservationsByProduct = useCallback((productId: string): Reservation[] => {
    return reservations.filter(res => res.productId === productId);
  }, [reservations]);

  const removeReservationsForProduct = useCallback(async (productId: string) => {
    const originalReservations = reservations;
    setReservations(prev => prev.filter(res => res.productId !== productId));

    try {
        const response = await fetch(`${API_BASE_URL}/reservations/product/${productId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await fetchReservations();

    } catch (error: any) {
        setReservationError(error.message);
        console.error("Error removing reservations:", error);
        setReservations(originalReservations);
    }
  }, [reservations, fetchReservations]);

  const value = useMemo(() => ({ 
    reservations,
    isLoadingReservations,
    reservationError,
    addReservation,
    hasUserReserved,
    getReservationsByProduct,
    removeReservationsForProduct,
    fetchReservations,
  }), [
    reservations,
    isLoadingReservations,
    reservationError,
    addReservation,
    hasUserReserved,
    getReservationsByProduct,
    removeReservationsForProduct,
    fetchReservations,
  ]);

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error('useReservation must be used within a ProductProvider');
  }
  return context;
};
