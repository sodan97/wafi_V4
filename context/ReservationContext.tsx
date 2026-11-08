import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Reservation } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../src/firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  Query,
  DocumentData,
} from 'firebase/firestore';

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
      // Les règles Firestore n'autorisent que l'admin à tout lire ; un client ne lit que ses réservations.
      const reservationsRef = collection(db, 'reservations');
      const q: Query<DocumentData> = currentUser.role === 'admin'
        ? reservationsRef
        : query(reservationsRef, where('userId', '==', currentUser.id));

      const snapshot = await getDocs(q);
      setReservations(snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          productId: d.productId,
          userId: d.userId,
          guestEmail: d.guestEmail,
          notificationMethod: d.notificationMethod,
          createdAt: d.createdAt,
          date: d.createdAt || d.date,
        } as Reservation;
      }));
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
    } else {
      setReservations([]);
    }
  }, [currentUser, fetchReservations]);

  const addReservation = useCallback(async (productId: string, userId: string) => {
    if (reservations.some(res => res.productId === productId && res.userId === userId)) {
      return;
    }

    const createdAt = new Date().toISOString();
    const tempReservation: Reservation = { productId, userId, date: createdAt };
    setReservations(prev => [...prev, tempReservation]);

    try {
      const docRef = await addDoc(collection(db, 'reservations'), {
        productId,
        userId,
        notificationMethod: 'email',
        createdAt,
        status: 'pending',
      });
      setReservations(prev => prev.map(r => r === tempReservation ? { ...r, id: docRef.id } : r));
    } catch (error: any) {
      setReservationError(error.message);
      console.error("Error adding reservation:", error);
      setReservations(prev => prev.filter(r => r !== tempReservation));
    }
  }, [reservations]);

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
      const snapshot = await getDocs(query(collection(db, 'reservations'), where('productId', '==', productId)));
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'reservations', d.id))));
    } catch (error: any) {
      setReservationError(error.message);
      console.error("Error removing reservations:", error);
      setReservations(originalReservations);
    }
  }, [reservations]);

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
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
