
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// POST /api/users/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Format d\'email invalide'),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères').matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
    body('firstName').notEmpty().withMessage('Le prénom est requis'),
    body('lastName').notEmpty().withMessage('Le nom est requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName } = req.body;
    const db = req.db; // Access Firestore instance from middleware

    try {
      // Check if user already exists
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user object with a 'role' field
      const newUser = {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role: 'client', // Default role is 'client'
        createdAt: new Date().toISOString(),
      };

      // Add the new user to the 'users' collection in Firestore
      const docRef = await db.collection('users').add(newUser);

      // Respond with the created user (excluding password)
      const userResponse = { ...newUser, id: docRef.id };
      delete userResponse.password;

      res.status(201).json(userResponse);

    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Erreur du serveur' });
    }
  }
);

// POST /api/users/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage("Format d'email invalide"),
    body('password').notEmpty().withMessage('Le mot de passe est requis'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = req.db;

    try {
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const isMatch = await bcrypt.compare(password, userData.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Identifiants invalides' });
      }

      // Create JWT payload with the user's role
      const payload = {
        id: userDoc.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'client', // Use role from DB, default to 'client'
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      // Prepare user response (excluding password)
      const userResponse = { ...userData, id: userDoc.id };
      delete userResponse.password;

      res.json({ token, user: userResponse });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Erreur du serveur' });
    }
  }
);

export default router;
