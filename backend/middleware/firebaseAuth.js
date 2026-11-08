import admin from 'firebase-admin';

// Vérifie le jeton Firebase (Authorization: Bearer <idToken>) et charge le rôle depuis Firestore.
export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(header.slice(7));
    const userDoc = await req.db.collection('users').doc(decoded.uid).get();
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      role: userDoc.exists ? userDoc.data().role || 'user' : 'user',
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Jeton invalide ou expiré' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};
