import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
  const db = req.db;
  const { userId, productId, notificationMethod } = req.body;

  if (!userId || !productId) {
    return res.status(400).json({ message: 'userId and productId are required' });
  }

  try {
    const existingReservation = await db
      .collection('reservations')
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .get();

    if (!existingReservation.empty) {
      return res.status(400).json({ message: 'Reservation already exists for this product' });
    }

    const docRef = await db.collection('reservations').add({
      userId,
      productId,
      notificationMethod: notificationMethod || 'whatsapp',
      createdAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    const reservation = { id: doc.id, ...doc.data() };

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (user && user.email && notificationMethod === 'email') {
      console.log(`📧 [Reservation] Email confirmation would be sent to ${user.email}`);
    }

    res.status(201).json({
      message: 'Successfully subscribed to product notifications',
      reservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Failed to create reservation' });
  }
});

router.post('/guest', async (req, res) => {
  const db = req.db;
  const { email, productId, notificationMethod } = req.body;

  if (!email || !productId) {
    return res.status(400).json({ message: 'email and productId are required' });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const existingReservation = await db
      .collection('reservations')
      .where('guestEmail', '==', email)
      .where('productId', '==', productId)
      .get();

    if (!existingReservation.empty) {
      return res.status(400).json({ message: 'Reservation already exists for this email and product' });
    }

    const docRef = await db.collection('reservations').add({
      guestEmail: email,
      productId,
      notificationMethod: notificationMethod || 'email',
      createdAt: new Date().toISOString()
    });

    const doc = await docRef.get();
    const reservation = { id: doc.id, ...doc.data() };

    console.log(`📧 [Reservation] Guest email confirmation would be sent to ${email}`);

    res.status(201).json({
      message: 'Successfully subscribed to product notifications',
      reservation
    });
  } catch (error) {
    console.error('Error creating guest reservation:', error);
    res.status(500).json({ message: 'Failed to create guest reservation' });
  }
});

router.get('/mine', async (req, res) => {
  const db = req.db;

  try {
    const snapshot = await db.collection('reservations').get();
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().createdAt || doc.data().date || new Date().toISOString()
    }));
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

router.get('/', async (req, res) => {
  const db = req.db;
  const { userId, productId } = req.query;

  if (!userId && !productId) {
    return res.status(400).json({ message: 'userId or productId query parameter is required' });
  }

  try {
    let query = db.collection('reservations');

    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (productId) {
      query = query.where('productId', '==', productId);
    }

    const snapshot = await query.get();
    const reservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

router.delete('/:id', async (req, res) => {
  const db = req.db;
  const reservationId = req.params.id;

  try {
    await db.collection('reservations').doc(reservationId).delete();
    res.json({ message: 'Reservation removed' });
  } catch (error) {
    console.error('Error removing reservation:', error);
    res.status(500).json({ message: 'Failed to remove reservation' });
  }
});

export default router;
