import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// --- Firebase Initialization ---
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
  );
} else {
  const { default: localKey } = await import('./serviceAccountKey.json', { with: { type: 'json' } });
  serviceAccount = localKey;
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    admin.app(); 
  } else {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const app = express();

// --- Middleware ---

const allowedOrigins = [
  'https://9000-firebase-waafi23-1764438515401.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
};

app.use(cors(corsOptions));

app.use(express.json());
app.use((req, res, next) => {
  req.db = db;
  next();
});

// --- API Routes ---
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes); 

// --- Server Initialization ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📧 Email notifications handled by Firebase Extension "Trigger Email"`);
});
