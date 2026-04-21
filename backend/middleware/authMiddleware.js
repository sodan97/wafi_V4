import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer '
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Check if token exists after splitting
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, malformed token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return; // Stop execution if user not found
      }

      next();
    } catch (error) {
      console.error('JWT Error:', error.message);

      // Provide specific error messages based on error type
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Token invalide. Veuillez vous reconnecter.',
          error: 'INVALID_TOKEN'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token expiré. Veuillez vous reconnecter.',
          error: 'EXPIRED_TOKEN'
        });
      } else {
        return res.status(401).json({
          message: 'Erreur d\'authentification. Veuillez vous reconnecter.',
          error: 'AUTH_ERROR'
        });
      }
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

export { protect, admin };