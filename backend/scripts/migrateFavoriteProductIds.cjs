const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialisé.');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Échec initialisation Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

const migrateFavoriteProductIds = async () => {
  console.log('Début migration des productId favoris vers string...');
  try {
    const snapshot = await db.collection('favorites').get();
    console.log(`Documents trouvés: ${snapshot.size}`);

    let updatedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const { productId } = data;

      if (productId === undefined || productId === null) {
        console.warn(`⚠️ Favori ${doc.id} sans productId, ignoré.`);
        continue;
      }

      if (typeof productId === 'string') {
        console.log(`✔️ Favori ${doc.id}: productId déjà string (${productId}).`);
        continue;
      }

      const normalizedProductId = String(productId);
      await doc.ref.update({ productId: normalizedProductId });
      updatedCount += 1;
      console.log(`✅ Favori ${doc.id}: productId converti (${productId} -> ${normalizedProductId}).`);
    }

    console.log(`Migration terminée. ${updatedCount} favoris mis à jour.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur pendant la migration:', error);
    process.exit(1);
  }
};

migrateFavoriteProductIds();
