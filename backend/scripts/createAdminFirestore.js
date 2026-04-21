import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import serviceAccount from '../serviceAccountKey.json' with { type: 'json' };
import bcrypt from 'bcryptjs';

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

const createAdminUser = async () => {
  try {
    console.log('🔍 Vérification du compte administrateur...');
    
    const usersSnapshot = await db.collection('users').where('email', '==', 'admin@wafi.com').get();
    
    if (!usersSnapshot.empty) {
      console.log('⚠️  Un compte admin existe déjà avec cet email');
      console.log('📧 Email: admin@wafi.com');
      console.log('🔑 Mot de passe: admin123');
      process.exit(0);
    }

    console.log('👤 Création du compte administrateur...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = {
      email: 'admin@wafi.com',
      firstName: 'Admin',
      lastName: 'Wafi',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };
    
    await db.collection('users').add(adminUser);
    
    console.log('🎉 Compte administrateur créé avec succès !');
    console.log('📧 Email: admin@wafi.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  } finally {
    process.exit(0);
  }
};

createAdminUser();
