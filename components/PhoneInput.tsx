import React from 'react';
import { PRIORITY_COUNTRIES, OTHER_COUNTRIES, PhoneParts, CountryCode } from '../src/utils/phone';
import { Required, Optional, FieldError, fieldClass, labelClass } from './FormParts';

// Fichier séparé : la liste des indicatifs n'est chargée qu'avec le panier et le profil

interface PhoneInputProps {
  id: string;
  label: string;
  value: PhoneParts;
  onChange: (value: PhoneParts) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

// Choix du pays (Sénégal par défaut) + numéro tel qu'on le compose dans ce pays
export const PhoneInput: React.FC<PhoneInputProps> = ({ id, label, value, onChange, required, error, hint, disabled }) => {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}{required ? <Required /> : <Optional />}
      </label>
      <div className="mt-1.5 flex gap-2">
        <select
          aria-label="Pays du numéro"
          value={value.country}
          onChange={e => onChange({ ...value, country: e.target.value as CountryCode })}
          disabled={disabled}
          className={`w-[9.5rem] shrink-0 rounded-xl border-0 bg-cream px-2 py-3 text-sm text-ink-900 ring-1 focus:outline-none focus:ring-2 sm:w-48 ${error ? 'ring-red-400 focus:ring-red-500' : 'ring-ink-900/10 focus:ring-brand-400'}`}
        >
          {PRIORITY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} (+{c.dialCode})</option>)}
          <option disabled>──────────</option>
          {OTHER_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} (+{c.dialCode})</option>)}
        </select>
        <input
          type="tel"
          id={id}
          value={value.national}
          onChange={e => onChange({ ...value, national: e.target.value })}
          placeholder={value.country === 'SN' ? '77 123 45 67' : 'Numéro'}
          autoComplete="tel-national"
          inputMode="tel"
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${fieldClass(!!error)} min-w-0 flex-1`}
        />
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
};
