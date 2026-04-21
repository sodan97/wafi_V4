
import express from 'express';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/orders - Add a new order
router.post('/', [
  body('customer').isObject(),
  body('items').isArray({ min: 1 }),
  body('total').isFloat({ gt: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { customer, items, total, userId } = req.body;
    const now = new Date().toISOString();
    const newOrder = {
      customer,
      items,
      total,
      userId: userId || null,
      status: 'Pas commencé', // Default status
      createdAt: now,
      date: now,
    };

    const docRef = await req.db.collection('orders').add(newOrder);
    res.status(201).json({ id: docRef.id, _id: docRef.id, ...newOrder });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/orders - Get all orders (for admin)
router.get('/', async (req, res) => {
  try {
    const ordersRef = req.db.collection('orders');
    const snapshot = await ordersRef.orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        _id: doc.id,
        ...data,
        date: data.date || data.createdAt,
      };
    });
    res.json(orders);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/orders/myorders - Get orders for a specific user
router.get('/myorders', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const ordersRef = req.db.collection('orders');
    const snapshot = await ordersRef.where('userId', '==', userId).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        _id: doc.id,
        ...data,
        date: data.date || data.createdAt,
      };
    });
    res.json(orders);

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/orders/:id/status - Update order status (for admin)
router.put('/:id/status', [
  param('id').isString().notEmpty(),
  body('status').isString().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { status, handledByName } = req.body;

    const docRef = req.db.collection('orders').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status };
    if (handledByName !== undefined) {
      updateData.handledByName = handledByName;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const data = updatedDoc.data();
    res.json({
      id: updatedDoc.id,
      _id: updatedDoc.id,
      ...data,
      date: data.date || data.createdAt,
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
