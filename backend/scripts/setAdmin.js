
import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };

// --- Firebase Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized successfully.');
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // App is already initialized, ignore.
    admin.app();
  } else {
    console.error('❌ Firebase Admin SDK initialization failed:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const usersCollection = db.collection('users');

/**
 * Sets a user as an administrator in Firestore by their email.
 * @param {string} email The email of the user to promote to admin.
 */
const setAdmin = async (email) => {
  if (!email) {
    console.error('❌ Erreur : Veuillez fournir une adresse e-mail en argument.');
    console.log('Usage: node backend/scripts/setAdmin.js admin@wafi.com');
    process.exit(1);
  }

  try {
    const querySnapshot = await usersCollection.where('email', '==', email).get();

    if (querySnapshot.empty) {
      console.error(`❌ Aucun utilisateur trouvé avec l\'e-mail : ${email}`);
      process.exit(1);
    }

    // Emails are unique, so we can safely take the first result.
    const userDoc = querySnapshot.docs[0];
    await userDoc.ref.update({ role: 'admin' });

    console.log(`✅ L\'utilisateur "${email}" a été promu au rang d\'administrateur.`);

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du rôle de l'utilisateur :", error);
  } finally {
    // End the script process
    process.exit(0);
  }
};

// Get email from command-line arguments
const emailToPromote = process.argv[2];
setAdmin(emailToPromote);
