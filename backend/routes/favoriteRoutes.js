import express from 'express';
import { requireAuth } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Toutes les routes favoris concernent uniquement l'utilisateur connecté
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const snapshot = await req.db.collection('favorites').where('userId', '==', req.user.uid).get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

router.post('/', async (req, res) => {
  const { productId } = req.body;
  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ message: 'productId is required' });
  }

  try {
    const docRef = await req.db.collection('favorites').add({
      userId: req.user.uid,
      productId,
      createdAt: new Date().toISOString(),
    });
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const docRef = req.db.collection('favorites').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await docRef.delete();
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

export default router;
