
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

// --- Firebase Initialization ---
// Initialize the app if it's not already initialized
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const productsCollection = db.collection('products');

// --- Sample Product Data ---
const sampleProducts = [
  {
    name: 'Sérum Éclat à la Vitamine C',
    description: 'Un sérum puissant pour illuminer et unifier le teint.',
    price: 45.00,
    category: 'Sérums',
    stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2VydW18ZW58MHx8MHx8fDA%3D',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Crème Hydratante Acide Hyaluronique',
    description: 'Hydratation intense pour une peau douce et souple toute la journée.',
    price: 38.50,
    category: 'Crèmes',
    stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1631750979434-5310a0f971c2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y3JlYW18ZW58MHx8MHx8fDA%3D',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Nettoyant Doux pour le Visage',
    description: 'Élimine les impuretés sans dessécher la peau.',
    price: 25.00,
    category: 'Nettoyants',
    stock: 300,
    imageUrl: 'https://plus.unsplash.com/premium_photo-1679924514299-9eb1035b36e8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Y2xlYW5zZXJ8ZW58MHx8MHx8fDA%3D',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// --- Seeding Function ---
const seedDatabase = async () => {
  try {
    console.log('Starting to seed the database...');

    for (const product of sampleProducts) {
      await productsCollection.add(product);
      console.log(`Added product: ${product.name}`);
    }

    console.log('✅ Database seeding completed successfully!');
    process.exit(0); // Exit successfully
  } catch (error) {
    console.error('❌ Error seeding the database:', error);
    process.exit(1); // Exit with error
  }
};

seedDatabase();
