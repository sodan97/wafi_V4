import React from 'react';

// Astérisque des champs obligatoires (le texte « obligatoire » est lu par les lecteurs d'écran)
export const Required: React.FC = () => (
  <span className="text-red-600">
    <span aria-hidden="true"> *</span>
    <span className="sr-only"> (obligatoire)</span>
  </span>
);

export const Optional: React.FC = () => <span className="font-normal text-ink-500"> (facultatif)</span>;

// Rappel placé en haut de chaque formulaire
export const RequiredLegend: React.FC<{ className?: string }> = ({ className = '' }) => (
  <p className={`text-xs text-ink-500 ${className}`}>
    Les champs marqués d’un <span className="font-semibold text-red-600">*</span> sont obligatoires.
  </p>
);

export const fieldClass = (hasError: boolean) =>
  `block w-full rounded-xl border-0 bg-cream px-4 py-3 text-ink-900 ring-1 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 disabled:opacity-60 ${hasError ? 'ring-red-400 focus:ring-red-500' : 'ring-ink-900/10 focus:ring-brand-400'}`;

export const inputClass = (hasError: boolean) => `mt-1.5 ${fieldClass(hasError)}`;

export const labelClass = 'block text-sm font-semibold text-ink-700';

export const FieldError: React.FC<{ id?: string; message?: string }> = ({ id, message }) =>
  message ? <p id={id} className="mt-1 text-xs text-red-600">{message}</p> : null;
