import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../src/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'role'>) => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  isLoadingAuth: boolean;
  authError: Error | string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<Error | string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoadingAuth(true);
      setAuthError(null);
      
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              role: userData.role || 'user',
              password: ''
            };
            setCurrentUser(user);
            
            if (user.role === 'admin') {
              await fetchUsers();
            }
          } else {
            console.error('User document not found in Firestore');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          setUsers([]);
        }
      } catch (error) {
        console.error("Authentication state change error:", error);
        setAuthError(error instanceof Error ? error : new Error(String(error)));
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList: User[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        password: ''
      } as User));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'user',
          password: ''
        };
        
        setCurrentUser(user);
        
        if (user.role === 'admin') {
          await fetchUsers();
        }
        
        return user;
      } else {
        throw new Error('Données utilisateur introuvables');
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = 'Email ou mot de passe incorrect';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mot de passe incorrect';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Réessayez plus tard';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou mot de passe incorrect';
      }
      
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUsers([]);
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'role'>): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        password: ''
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: new Date().toISOString()
      });

      setCurrentUser(newUser);

      try {
        const notificationService = (await import('../src/services/notificationService')).default;
        await notificationService.sendWelcomeEmail(
          newUser.email,
          `${newUser.firstName} ${newUser.lastName}`.trim()
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return newUser;
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = 'Échec de l\'inscription';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Cet email est déjà utilisé';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      }

      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let user: User;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: userData.role || 'user',
          password: ''
        };
      } else {
        const displayNameParts = firebaseUser.displayName?.split(' ') || ['', ''];
        const firstName = displayNameParts[0] || '';
        const lastName = displayNameParts.slice(1).join(' ') || '';

        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: firstName,
          lastName: lastName,
          role: 'user',
          password: ''
        };

        await setDoc(userDocRef, {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: new Date().toISOString(),
          authProvider: 'google'
        });
      }

      setCurrentUser(user);

      if (user.role === 'admin') {
        await fetchUsers();
      }

      return user;
    } catch (error: any) {
      console.error("Google login error:", error);
      let errorMessage = 'Échec de la connexion avec Google';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Connexion annulée';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup bloquée par le navigateur';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Connexion annulée';
      }

      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset error:", error);
      let errorMessage = 'Échec de l\'envoi de l\'email de réinitialisation';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cet email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email invalide';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Réessayez plus tard';
      }

      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, loginWithGoogle, logout, register, resetPassword, isLoadingAuth, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
