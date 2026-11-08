// Règles communes aux formulaires (inscription, profil, commande)

// Lettres de toutes les langues (é, ë, ñ, ç…), espaces, apostrophes et tirets
const NAME_REGEX = /^[\p{L}\s'’-]+$/u;

export const validateName = (value: string, label: 'prénom' | 'nom'): string => {
  const trimmed = value.trim();
  if (!trimmed) return `Le ${label} est requis.`;
  if (trimmed.length < 2) return `Le ${label} doit contenir au moins 2 caractères.`;
  if (!NAME_REGEX.test(trimmed)) return 'Seules les lettres, espaces, apostrophes et tirets sont autorisés.';
  return '';
};

export const validateNewPassword = (value: string): string => {
  if (!value) return 'Le mot de passe est requis.';
  if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    return 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.';
  }
  return '';
};

export const MAX_ADDRESS_LENGTH = 300;
