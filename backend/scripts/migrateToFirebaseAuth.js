import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };

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
const auth = admin.auth();

const migrateUsersToFirebaseAuth = async () => {
  try {
    console.log('🔄 Début de la migration des utilisateurs vers Firebase Authentication...\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('⚠️  Aucun utilisateur trouvé dans Firestore.');
      process.exit(0);
    }

    console.log(`📊 ${usersSnapshot.size} utilisateur(s) trouvé(s) dans Firestore.\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const email = userData.email;
      
      console.log(`\n🔍 Traitement de l'utilisateur: ${email}`);

      try {
        let firebaseUser;
        
        try {
          firebaseUser = await auth.getUserByEmail(email);
          console.log(`   ⏭️  Utilisateur déjà existant dans Firebase Auth (UID: ${firebaseUser.uid})`);
          
          if (firebaseUser.uid !== userDoc.id) {
            console.log(`   🔄 Mise à jour du document Firestore avec le nouvel UID...`);
            await db.collection('users').doc(firebaseUser.uid).set({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role || 'user',
              createdAt: userData.createdAt || new Date().toISOString(),
              migratedAt: new Date().toISOString()
            });
            
            if (userDoc.id !== firebaseUser.uid) {
              await db.collection('users').doc(userDoc.id).delete();
              console.log(`   🗑️  Ancien document supprimé (ID: ${userDoc.id})`);
            }
          }
          
          skipCount++;
          continue;
        } catch (error) {
          if (error.code !== 'auth/user-not-found') {
            throw error;
          }
        }

        const defaultPassword = 'ChangeMe123!';
        
        firebaseUser = await auth.createUser({
          email: email,
          password: defaultPassword,
          displayName: `${userData.firstName} ${userData.lastName}`,
          emailVerified: false
        });

        console.log(`   ✅ Utilisateur créé dans Firebase Auth (UID: ${firebaseUser.uid})`);

        await db.collection('users').doc(firebaseUser.uid).set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'user',
          createdAt: userData.createdAt || new Date().toISOString(),
          migratedAt: new Date().toISOString()
        });

        if (userDoc.id !== firebaseUser.uid) {
          await db.collection('users').doc(userDoc.id).delete();
          console.log(`   🗑️  Ancien document supprimé (ID: ${userDoc.id})`);
        }

        console.log(`   📧 Mot de passe temporaire: ${defaultPassword}`);
        console.log(`   ⚠️  L'utilisateur devra réinitialiser son mot de passe`);

        successCount++;

      } catch (error) {
        console.error(`   ❌ Erreur lors de la migration de ${email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('='.repeat(60));
    console.log(`✅ Utilisateurs migrés avec succès: ${successCount}`);
    console.log(`⏭️  Utilisateurs déjà existants: ${skipCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total traité: ${usersSnapshot.size}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n⚠️  IMPORTANT:');
      console.log('   - Les utilisateurs migrés ont le mot de passe temporaire: ChangeMe123!');
      console.log('   - Ils doivent utiliser la fonction "Mot de passe oublié" pour réinitialiser');
      console.log('   - Ou vous pouvez leur envoyer un lien de réinitialisation manuellement');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    process.exit(0);
  }
};

migrateUsersToFirebaseAuth();
