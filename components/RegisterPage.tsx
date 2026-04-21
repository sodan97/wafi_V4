import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { View } from '../App';

interface RegisterPageProps {
  setView: (view: View) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ setView }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'Faible' | 'Moyen' | 'Fort' | ''>('');
  const { register, loginWithGoogle } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific validation error when user types
    setValidationErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
    // Update password strength on password change
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateField = (name: string, value: string): string => {
    let error = '';
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = 'Ce champ est requis.';
        } else if (value.trim().length < 2) {
          error = 'Doit contenir au moins 2 caractères.';
        } else if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value)) {
           error = 'Seules les lettres, espaces, apostrophes et tirets sont autorisés.';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'L\'email est requis.';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Veuillez entrer une adresse email valide (ex: nom@gmail.com).';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Le mot de passe est requis.';
        } else if (value.length < 8) {
          error = 'Le mot de passe doit contenir au moins 8 caractères.';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };

    setValidationErrors(errors);

    // Return true if there are no errors
    return Object.values(errors).every(error => error === '');
  };

  // Initial check for password strength if there's an initial password value
  useEffect(() => { 
    checkPasswordStrength(formData.password); 
  }, [formData.password]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    if (password.length === 0) setPasswordStrength('');
    else if (strength < 2) setPasswordStrength('Faible');
    else if (strength < 4) setPasswordStrength('Moyen');
    else setPasswordStrength('Fort');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const user = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (user) {
        setView('products');
      } else {
        setError('Échec de l\'inscription. Veuillez réessayer.');
      }
    } catch (error: any) {
      console.error("Registration failed:", error);

      const errorMessage = error.message || 'Une erreur est survenue';

      if (errorMessage.includes('déjà utilisé') || errorMessage.includes('already in use')) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Cette adresse email est déjà utilisée. Essayez de vous connecter.'
        }));
      } else if (errorMessage.includes('Email invalide') || errorMessage.includes('invalid-email')) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Format d\'email invalide.'
        }));
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.includes('mot de passe')) {
        setValidationErrors(prev => ({
          ...prev,
          password: 'Le mot de passe ne respecte pas les critères requis.'
        }));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Échec de la connexion avec Google');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Faible': return 'text-red-500';
      case 'Moyen': return 'text-orange-500';
      case 'Fort': return 'text-green-500';
      default: return '';
    }
  };

  const getPasswordStrengthBg = () => {
    switch (passwordStrength) {
      case 'Faible': return 'bg-red-100 border-red-200';
      case 'Moyen': return 'bg-orange-100 border-orange-200';
      case 'Fort': return 'bg-green-100 border-green-200';
      default: return '';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Créer un compte</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="Votre prénom"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
                validationErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {validationErrors.firstName && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.firstName}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Votre nom"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
                validationErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            {validationErrors.lastName && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.lastName}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
              validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {validationErrors.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationErrors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Votre mot de passe"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
                validationErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {validationErrors.password && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {validationErrors.password}
            </p>
          )}
          
          {formData.password && passwordStrength && (
            <div className={`text-xs mt-2 p-2 rounded border ${getPasswordStrengthBg()}`}>
              <p className={`font-medium ${getPasswordStrengthColor()}`}>
                Force du mot de passe : {passwordStrength}
              </p>
              {passwordStrength !== 'Fort' && (
                <p className="text-gray-600 mt-1">
                  Conseils : utilisez au moins 8 caractères avec majuscules, minuscules, chiffres et symboles.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-rose-500 hover:bg-rose-600 hover:shadow-xl transform hover:-translate-y-0.5'
            } text-white`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Inscription...
              </div>
            ) : (
              'S\'inscrire'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Continuer avec Google</span>
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Déjà un compte ?{' '}
          <button 
            onClick={() => setView('login')} 
            className="font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
            disabled={isLoading}
          >
            Connectez-vous ici
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;