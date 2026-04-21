import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { View } from '../App';

interface LoginPageProps {
  setView: (view: View) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return 'L\'email est requis.';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Veuillez entrer une adresse email valide.';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Le mot de passe est requis.';
    }
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setFieldErrors(prev => ({ ...prev, email: '' }));
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setFieldErrors(prev => ({ ...prev, password: '' }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });
    setIsLoading(true);

    // Validation côté client
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError
      });
      setIsLoading(false);
      return;
    }

    try {
      const user = await login(email, password);
      if (!user) {
        setError('Échec de la connexion. Veuillez réessayer.');
      }
      // Si la connexion réussit, la navigation sera gérée par App.tsx
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Gestion des erreurs spécifiques
      const errorMessage = err.message || 'Une erreur est survenue';
      
      if (errorMessage.toLowerCase().includes('email')) {
        setFieldErrors(prev => ({ ...prev, email: 'Email incorrect ou inexistant.' }));
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('mot de passe')) {
        setFieldErrors(prev => ({ ...prev, password: 'Mot de passe incorrect.' }));
      } else if (errorMessage.toLowerCase().includes('credentials') || errorMessage.toLowerCase().includes('incorrect')) {
        setError('Email ou mot de passe incorrect. Veuillez vérifier vos informations.');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const emailError = validateEmail(resetEmail);
    if (emailError) {
      setResetError(emailError);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess('Un email de réinitialisation a été envoyé à votre adresse email.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetError(err.message || 'Échec de l\'envoi de l\'email');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      {!showForgotPassword ? (
        <>
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
                  fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="nom@gmail.com"
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
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
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors ${
                    fieldErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
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
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                disabled={isLoading}
              >
                Mot de passe oublié ?
              </button>
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
                    Connexion...
                  </div>
                ) : (
                  'Se connecter'
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
              Pas encore de compte ?{' '}
              <button
                onClick={() => setView('register')}
                className="font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors"
                disabled={isLoading}
              >
                Inscrivez-vous ici
              </button>
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetError('');
                setResetSuccess('');
              }}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </button>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Mot de passe oublié</h2>
          <p className="text-center text-gray-600 mb-6">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            {resetSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <p className="text-sm flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {resetSuccess}
                </p>
              </div>
            )}

            {resetError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{resetError}</p>
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="reset-email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
                placeholder="votre@email.com"
                disabled={isLoading}
              />
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
                    Envoi...
                  </div>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default LoginPage;