import Product from '../models/Product.js';
import User from '../models/User.js';
import { PRODUCTS } from '../constants/products.js';
import bcrypt from 'bcryptjs';

export const initializeDatabase = async () => {
  try {
    console.log('🔍 Vérification des produits existants...');
    
    // Vérifier si des produits existent déjà
    const existingProductsCount = await Product.countDocuments();
    console.log(`📊 Produits existants: ${existingProductsCount}`);
    
    if (existingProductsCount === 0) {
      console.log('📦 Aucun produit trouvé. Initialisation avec les produits par défaut...');
      
      // Insérer les produits par défaut
      const insertedProducts = await Product.insertMany(PRODUCTS);
      console.log(`✅ ${insertedProducts.length} produits ajoutés avec succès !`);
      
      // Afficher les produits ajoutés
      insertedProducts.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id})`);
      });
    } else {
      console.log('✅ Base de données déjà initialisée avec des produits.');
    }

    // Vérifier et créer un compte admin par défaut
    console.log('🔍 Vérification du compte administrateur...');
    const existingAdmin = await User.findOne({ email: 'admin@wafi.com' });
    
    if (!existingAdmin) {
      console.log('👤 Aucun compte admin trouvé. Création du compte administrateur par défaut...');
      
      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const adminUser = new User({
        email: 'admin@wafi.com',
        firstName: 'Admin',
        lastName: 'Wafi',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Compte administrateur créé avec succès !');
      console.log('   📧 Email: admin@wafi.com');
      console.log('   🔑 Mot de passe: admin123');
      console.log('   ⚠️  IMPORTANT: Changez ce mot de passe après la première connexion !');
    } else {
      console.log('✅ Compte administrateur déjà existant.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
};