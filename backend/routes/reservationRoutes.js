import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/firebaseAuth.js';

const router = express.Router();

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// POST /api/reservations - Réservation de l'utilisateur connecté
router.post('/', requireAuth, async (req, res) => {
  const db = req.db;
  const userId = req.user.uid;
  const { productId, notificationMethod } = req.body;

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ message: 'productId is required' });
  }

  try {
    const existing = await db.collection('reservations')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'Reservation already exists for this product' });
    }

    const docRef = await db.collection('reservations').add({
      userId,
      productId,
      notificationMethod: notificationMethod === 'whatsapp' ? 'whatsapp' : 'email',
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    const doc = await docRef.get();
    res.status(201).json({
      message: 'Successfully subscribed to product notifications',
      reservation: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Failed to create reservation' });
  }
});

// POST /api/reservations/guest - Réservation invité (email uniquement)
router.post('/guest', async (req, res) => {
  const db = req.db;
  const { email, productId } = req.body;

  if (!email || !productId || typeof productId !== 'string') {
    return res.status(400).json({ message: 'email and productId are required' });
  }
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const product = await db.collection('products').doc(productId).get();
    if (!product.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existing = await db.collection('reservations')
      .where('guestEmail', '==', email)
      .where('productId', '==', productId)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ message: 'Reservation already exists for this email and product' });
    }

    const docRef = await db.collection('reservations').add({
      guestEmail: email,
      productId,
      notificationMethod: 'email',
      createdAt: new Date().toISOString(),
      status: 'pending',
    });
    // Ne renvoie pas les données : évite d'exposer quoi que ce soit à un appelant anonyme
    res.status(201).json({ message: 'Successfully subscribed to product notifications', id: docRef.id });
  } catch (error) {
    console.error('Error creating guest reservation:', error);
    res.status(500).json({ message: 'Failed to create guest reservation' });
  }
});

// GET /api/reservations/mine - Réservations de l'utilisateur connecté
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const snapshot = await req.db.collection('reservations').where('userId', '==', req.user.uid).get();
    res.json(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().createdAt || doc.data().date,
    })));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

// GET /api/reservations - Toutes les réservations, filtrables (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { userId, productId } = req.query;
  try {
    let query = req.db.collection('reservations');
    if (userId) query = query.where('userId', '==', String(userId));
    if (productId) query = query.where('productId', '==', String(productId));

    const snapshot = await query.get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

// DELETE /api/reservations/:id - Propriétaire ou admin
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const docRef = req.db.collection('reservations').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    if (doc.data().userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await docRef.delete();
    res.json({ message: 'Reservation removed' });
  } catch (error) {
    console.error('Error removing reservation:', error);
    res.status(500).json({ message: 'Failed to remove reservation' });
  }
});

export default router;
