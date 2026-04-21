import express from 'express';

const router = express.Router();

const normalizeProductData = (doc) => {
  const data = doc.data() || {};
  const normalized = { id: doc.id, ...data };

  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls
    : typeof data.imageUrl === 'string'
      ? [data.imageUrl]
      : Array.isArray(data.images)
        ? data.images
        : [];

  normalized.imageUrls = imageUrls;
  normalized.price = typeof data.price === 'string' ? Number(data.price) : data.price ?? 0;
  normalized.stock = typeof data.stock === 'string' ? Number(data.stock) : data.stock ?? 0;
  normalized.status = data.status || 'active';

  delete normalized.imageUrl;
  delete normalized.images;

  return normalized;
};

// GET /api/products
router.get('', async (req, res) => {
  const db = req.db;
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(normalizeProductData);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
