const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialisé.');
}

const db = admin.firestore();

const migrateProductIds = async () => {
  console.log('Début de la conversion des champs id des produits vers string...');
  try {
    const snapshot = await db.collection('products').get();
    console.log(`Documents produits trouvés: ${snapshot.size}`);

    let updatedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const currentId = data.id;

      if (currentId === undefined || currentId === null) {
        await doc.ref.update({ id: doc.id });
        updatedCount += 1;
        console.log(`🆔 Produit ${doc.id} sans champ id, défini sur doc.id.`);
        continue;
      }

      if (typeof currentId === 'string') {
        console.log(`✔️ Produit ${doc.id}: id déjà string (${currentId}).`);
        continue;
      }

      const normalizedId = String(currentId);
      await doc.ref.update({ id: normalizedId });
      updatedCount += 1;
      console.log(`✅ Produit ${doc.id}: id converti (${currentId} -> ${normalizedId}).`);
    }

    console.log(`Conversion terminée. ${updatedCount} produits mis à jour.`);
    process.exit(0);
  } catch (error) {
    console.error('Erreur pendant la conversion des ids produits:', error);
    process.exit(1);
  }
};

migrateProductIds();
