import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const db = req.db;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'userId query parameter is required' });
  }

  try {
    const snapshot = await db.collection('favorites').where('userId', '==', userId).get();
    const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

router.post('/', async (req, res) => {
  const db = req.db;
  const { userId, productId } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId and productId are required' });
  }

  try {
    const docRef = await db.collection('favorites').add({
      userId,
      productId,
      createdAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

router.delete('/:id', async (req, res) => {
  const db = req.db;
  const favoriteId = req.params.id;

  try {
    await db.collection('favorites').doc(favoriteId).delete();
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

export default router;
