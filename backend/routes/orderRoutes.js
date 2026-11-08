import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, requireAdmin } from '../middleware/firebaseAuth.js';

const router = express.Router();

const toOrder = (doc) => {
  const data = doc.data();
  return { id: doc.id, _id: doc.id, ...data, date: data.date || data.createdAt };
};

// POST /api/orders - Crée une commande. Les prix et le total sont recalculés côté serveur.
router.post('/', requireAuth, [
  body('customer').isObject(),
  body('customer.firstName').isString().trim().isLength({ min: 1, max: 100 }),
  body('customer.lastName').isString().trim().isLength({ min: 1, max: 100 }),
  body('customer.phone').isString().matches(/^\+?[0-9 ]{7,20}$/),
  body('customer.address').optional().isString().isLength({ max: 300 }),
  body('items').isArray({ min: 1, max: 50 }),
  body('items.*.productId').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1, max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { customer, items } = req.body;
    const productRefs = items.map(item => req.db.collection('products').doc(item.productId));
    const productDocs = await req.db.getAll(...productRefs);

    const orderItems = [];
    for (let i = 0; i < items.length; i++) {
      const product = productDocs[i];
      if (!product.exists) {
        return res.status(400).json({ message: `Produit introuvable : ${items[i].productId}` });
      }
      const { name, price, stock } = product.data();
      if ((stock ?? 0) < items[i].quantity) {
        return res.status(400).json({ message: `Stock insuffisant pour ${name}` });
      }
      orderItems.push({ productId: product.id, name, price: Number(price), quantity: items[i].quantity });
    }

    const now = new Date().toISOString();
    const newOrder = {
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        address: customer.address || '',
        email: req.user.email,
      },
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      userId: req.user.uid,
      status: 'pending',
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

// GET /api/orders - Toutes les commandes (admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const snapshot = await req.db.collection('orders').orderBy('date', 'desc').get();
    res.json(snapshot.docs.map(toOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/orders/myorders - Commandes de l'utilisateur connecté
router.get('/myorders', requireAuth, async (req, res) => {
  try {
    const snapshot = await req.db.collection('orders')
      .where('userId', '==', req.user.uid)
      .orderBy('date', 'desc')
      .get();
    res.json(snapshot.docs.map(toOrder));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT /api/orders/:id/status - Met à jour le statut (admin)
router.put('/:id/status', requireAuth, requireAdmin, [
  param('id').isString().notEmpty(),
  body('status').isString().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const docRef = req.db.collection('orders').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updateData = { status: req.body.status, handledBy: req.user.uid };
    if (req.body.handledByName !== undefined) {
      updateData.handledByName = String(req.body.handledByName);
    }
    await docRef.update(updateData);

    res.json(toOrder(await docRef.get()));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

export default router;
