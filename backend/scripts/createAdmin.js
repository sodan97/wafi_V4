import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import 'dotenv/config';

const createAdminUser = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@wafi.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Un compte admin existe déjà avec cet email');
      process.exit(0);
    }

    // Créer le compte admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const adminUser = new User({
      email: 'admin@wafi.com',
      firstName: 'Moustapha',
      lastName: 'DANSO',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    
    console.log('🎉 Compte administrateur créé avec succès !');
    console.log('📧 Email: admin@wafi.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser();