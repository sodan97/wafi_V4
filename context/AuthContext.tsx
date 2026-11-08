import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, ProfileUpdate } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { auth, db } from '../src/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, DocumentData } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'role'>) => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
  hasPasswordLogin: boolean;
  isLoadingAuth: boolean;
  authError: Error | string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toUser = (firebaseUser: FirebaseUser, data: DocumentData): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  firstName: data.firstName || '',
  lastName: data.lastName || '',
  role: data.role || 'user',
  phone: data.phone || '',
  address: data.address || '',
  password: '',
});

// Le compte se connecte-t-il avec un mot de passe (et pas seulement avec Google) ?
const usesPassword = (firebaseUser: FirebaseUser | null) =>
  !!firebaseUser?.providerData.some(p => p.providerId === 'password');

// Messages d'erreur lisibles pour la vérification d'identité avant une action sensible
const reauthErrorMessage = (error: any): string => {
  switch (error?.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Mot de passe actuel incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Vérification Google annulée.';
    case 'auth/popup-blocked':
      return 'La fenêtre Google a été bloquée par le navigateur. Autorisez les fenêtres pop-up et réessayez.';
    case 'auth/user-mismatch':
      return 'Choisissez le même compte Google que celui de votre compte WAFI.';
    case 'auth/network-request-failed':
      return 'Pas de connexion internet. Réessayez.';
    default:
      return error?.message || 'Une erreur est survenue. Réessayez.';
  }
};

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
            const user = toUser(firebaseUser, userDoc.data());
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
        const user = toUser(firebaseUser, userDoc.data());

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
        user = toUser(firebaseUser, userDoc.data());
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

  // ---------- Profil ----------

  const requireFirebaseUser = (): FirebaseUser => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Votre session a expiré. Reconnectez-vous.');
    return firebaseUser;
  };

  const updateProfile = async (data: ProfileUpdate): Promise<void> => {
    const firebaseUser = requireFirebaseUser();
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { ...data, updatedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Vos informations n’ont pas pu être enregistrées. Réessayez.');
    }
    setCurrentUser(prev => (prev ? { ...prev, ...data } : prev));
  };

  // Firebase exige une connexion récente avant de changer le mot de passe ou de supprimer le compte
  const reauthenticate = async (firebaseUser: FirebaseUser, currentPassword?: string) => {
    try {
      if (usesPassword(firebaseUser)) {
        if (!currentPassword) throw Object.assign(new Error('Entrez votre mot de passe actuel.'), { code: 'local/missing-password' });
        await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email || '', currentPassword));
      } else {
        await reauthenticateWithPopup(firebaseUser, new GoogleAuthProvider());
      }
    } catch (error: any) {
      throw new Error(reauthErrorMessage(error));
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const firebaseUser = requireFirebaseUser();
    await reauthenticate(firebaseUser, currentPassword);
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error: any) {
      console.error('Password change error:', error);
      throw new Error(error?.code === 'auth/weak-password'
        ? 'Ce mot de passe est trop faible.'
        : 'Le mot de passe n’a pas pu être changé. Réessayez.');
    }
  };

  // Supprime le profil, les favoris, les alertes de stock et les notifications, puis le compte.
  // Les commandes passées sont conservées (suivi des livraisons, comptabilité).
  const deleteAccount = async (currentPassword?: string): Promise<void> => {
    const firebaseUser = requireFirebaseUser();
    await reauthenticate(firebaseUser, currentPassword);
    const uid = firebaseUser.uid;
    try {
      for (const name of ['favorites', 'reservations', 'notifications']) {
        const snapshot = await getDocs(query(collection(db, name), where('userId', '==', uid)));
        await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      }
      await deleteDoc(doc(db, 'users', uid));
      await deleteUser(firebaseUser);
    } catch (error: any) {
      console.error('Account deletion error:', error);
      throw new Error('La suppression n’a pas pu aller jusqu’au bout. Réessayez ou écrivez-nous sur WhatsApp.');
    }
    setCurrentUser(null);
    setUsers([]);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, users, login, loginWithGoogle, logout, register, resetPassword,
      updateProfile, changePassword, deleteAccount,
      hasPasswordLogin: usesPassword(auth.currentUser),
      isLoadingAuth, authError,
    }}>
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
