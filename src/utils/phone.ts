// Numéros de téléphone de tous les pays (diaspora comprise), au format international.
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, CountryCode } from 'libphonenumber-js/min';

export type { CountryCode };

export interface CountryOption {
  code: CountryCode;
  name: string;
  dialCode: string;
}

// Sénégal d'abord, puis les pays où vit le plus de diaspora, puis tous les autres
const PRIORITY: CountryCode[] = ['SN', 'FR', 'IT', 'ES', 'US', 'CA', 'BE', 'GB', 'DE', 'CH', 'GM', 'MR', 'ML', 'GN', 'CI', 'MA'];

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' });
  } catch {
    return null;
  }
})();

const toOption = (code: CountryCode): CountryOption => ({
  code,
  name: regionNames?.of(code) ?? code,
  dialCode: getCountryCallingCode(code),
});

export const PRIORITY_COUNTRIES: CountryOption[] = PRIORITY.map(toOption);

export const OTHER_COUNTRIES: CountryOption[] = getCountries()
  .filter(code => !PRIORITY.includes(code))
  .map(toOption)
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export const DEFAULT_COUNTRY: CountryCode = 'SN';

export interface PhoneParts {
  country: CountryCode;
  national: string;
}

export interface PhoneCheck {
  valid: boolean;
  e164: string;          // +33612345678 (rempli si valid)
  international: string; // +33 6 12 34 56 78 (rempli si valid)
  error: string;         // message à afficher (rempli sinon)
}

// Vérifie le numéro saisi pour le pays choisi. Un numéro commençant par + ou 00 garde son propre indicatif.
export const checkPhone = ({ country, national }: PhoneParts): PhoneCheck => {
  const raw = national.trim().replace(/^00/, '+');
  if (!raw) return { valid: false, e164: '', international: '', error: 'Le numéro de téléphone est requis.' };

  const parsed = parsePhoneNumberFromString(raw, country);
  if (parsed?.isValid()) {
    return { valid: true, e164: parsed.number, international: parsed.formatInternational(), error: '' };
  }
  const countryName = regionNames?.of(country) ?? country;
  const example = country === 'SN' ? ' Exemple : 77 123 45 67.' : '';
  return {
    valid: false,
    e164: '',
    international: '',
    error: `Numéro invalide pour ${countryName}. Vérifiez le pays choisi et le numéro.${example}`,
  };
};

// Pour pré-remplir le formulaire à partir d'un numéro enregistré (+33612345678 → France + 6 12 34 56 78)
export const splitPhone = (e164: string | undefined | null): PhoneParts => {
  if (!e164) return { country: DEFAULT_COUNTRY, national: '' };
  const parsed = parsePhoneNumberFromString(e164);
  if (parsed?.country) {
    return { country: parsed.country, national: parsed.formatNational() };
  }
  return { country: DEFAULT_COUNTRY, national: e164 };
};

// Affichage lisible d'un numéro enregistré
export const formatPhone = (e164: string | undefined | null): string => {
  if (!e164) return '';
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
};
