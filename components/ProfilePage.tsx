import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkPhone, splitPhone, PhoneParts } from '../src/utils/phone';
import { validateName, validateNewPassword, MAX_ADDRESS_LENGTH } from '../src/utils/validation';
import { Required, Optional, RequiredLegend, FieldError, inputClass, labelClass } from './FormParts';
import { PhoneInput } from './PhoneInput';
import { CheckIcon, ShieldIcon, TrashIcon, UserIcon } from './icons';

interface ProfilePageProps {
  onAccountDeleted: () => void;
}

const card = 'rounded-[2rem] bg-white p-6 ring-1 ring-ink-900/5 sm:p-8';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-500/30';

const Spinner: React.FC = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;

const SuccessMessage: React.FC<{ message: string }> = ({ message }) =>
  message ? (
    <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
      <CheckIcon className="h-4 w-4 shrink-0" />{message}
    </p>
  ) : null;

const ErrorMessage: React.FC<{ message: string }> = ({ message }) =>
  message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null;

// ---------- Mes informations ----------

const InfoSection: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(currentUser?.firstName ?? '');
  const [lastName, setLastName] = useState(currentUser?.lastName ?? '');
  const [phone, setPhone] = useState<PhoneParts>(() => splitPhone(currentUser?.phone));
  const [address, setAddress] = useState(currentUser?.address ?? '');
  const [errors, setErrors] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [failure, setFailure] = useState('');

  const resetMessages = () => { setSuccess(''); setFailure(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const phoneCheck = phone.national.trim() ? checkPhone(phone) : null;
    const newErrors = {
      firstName: validateName(firstName, 'prénom'),
      lastName: validateName(lastName, 'nom'),
      phone: phoneCheck && !phoneCheck.valid ? phoneCheck.error : '',
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phoneCheck && phoneCheck.valid ? phoneCheck.e164 : '',
        address: address.trim(),
      });
      setSuccess('Vos informations sont enregistrées.');
    } catch (error: any) {
      setFailure(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={card} aria-labelledby="profile-info">
      <h2 id="profile-info" className="text-2xl font-semibold text-ink-900">Mes informations</h2>
      <p className="mt-1 text-sm text-ink-500">Elles servent à pré-remplir vos prochaines commandes.</p>
      <RequiredLegend className="mt-3" />

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-firstName" className={labelClass}>Prénom<Required /></label>
            <input id="profile-firstName" type="text" value={firstName} autoComplete="given-name" required
              onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })); resetMessages(); }}
              aria-invalid={!!errors.firstName} className={inputClass(!!errors.firstName)} />
            <FieldError message={errors.firstName} />
          </div>
          <div>
            <label htmlFor="profile-lastName" className={labelClass}>Nom<Required /></label>
            <input id="profile-lastName" type="text" value={lastName} autoComplete="family-name" required
              onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: '' })); resetMessages(); }}
              aria-invalid={!!errors.lastName} className={inputClass(!!errors.lastName)} />
            <FieldError message={errors.lastName} />
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className={labelClass}>Adresse e-mail</label>
          <input id="profile-email" type="email" value={currentUser?.email ?? ''} readOnly disabled className={inputClass(false)} />
          <p className="mt-1 text-xs text-ink-500">Elle sert à vous connecter et ne peut pas être modifiée ici. Écrivez-nous si besoin.</p>
        </div>

        <PhoneInput
          id="profile-phone"
          label="Téléphone (WhatsApp)"
          value={phone}
          onChange={value => { setPhone(value); setErrors(p => ({ ...p, phone: '' })); resetMessages(); }}
          error={errors.phone}
          hint="Numéros de tous les pays acceptés : choisissez d’abord le pays."
        />

        <div>
          <label htmlFor="profile-address" className={labelClass}>Adresse de livraison<Optional /></label>
          <input id="profile-address" type="text" value={address} maxLength={MAX_ADDRESS_LENGTH} autoComplete="street-address"
            placeholder="Cité Keur Gorgui, Lot 123, Dakar"
            onChange={e => { setAddress(e.target.value); resetMessages(); }}
            className={inputClass(false)} />
        </div>

        <SuccessMessage message={success} />
        <ErrorMessage message={failure} />

        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? <><Spinner />Enregistrement…</> : 'Enregistrer'}
        </button>
      </form>
    </section>
  );
};

// ---------- Mot de passe ----------

const PasswordSection: React.FC = () => {
  const { currentUser, hasPasswordLogin, changePassword, resetPassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [failure, setFailure] = useState('');

  if (!hasPasswordLogin) {
    return (
      <section className={card} aria-labelledby="profile-password">
        <h2 id="profile-password" className="text-2xl font-semibold text-ink-900">Mot de passe</h2>
        <p className="mt-2 text-sm text-ink-500">
          Vous vous connectez avec Google : il n’y a pas de mot de passe WAFI. Votre mot de passe se gère dans votre compte Google.
        </p>
      </section>
    );
  }

  const resetMessages = () => { setSuccess(''); setFailure(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const newErrors = {
      current: current ? '' : 'Entrez votre mot de passe actuel.',
      next: validateNewPassword(next) || (next && next === current ? 'Choisissez un mot de passe différent de l’actuel.' : ''),
      confirm: !confirm ? 'Confirmez le nouveau mot de passe.' : confirm !== next ? 'Les deux mots de passe ne sont pas identiques.' : '',
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSaving(true);
    try {
      await changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      setSuccess('Votre mot de passe a été modifié.');
    } catch (error: any) {
      if (error.message.startsWith('Mot de passe actuel')) {
        setErrors(p => ({ ...p, current: error.message }));
      } else {
        setFailure(error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    resetMessages();
    try {
      await resetPassword(currentUser?.email ?? '');
      setSuccess(`Un lien pour choisir un nouveau mot de passe a été envoyé à ${currentUser?.email}.`);
    } catch (error: any) {
      setFailure(error.message);
    }
  };

  const field = (id: 'current' | 'next' | 'confirm', label: string, value: string, setValue: (v: string) => void, autoComplete: string) => (
    <div>
      <label htmlFor={`password-${id}`} className={labelClass}>{label}<Required /></label>
      <input id={`password-${id}`} type={show ? 'text' : 'password'} value={value} autoComplete={autoComplete} required
        onChange={e => { setValue(e.target.value); setErrors(p => ({ ...p, [id]: '' })); resetMessages(); }}
        aria-invalid={!!errors[id]} className={inputClass(!!errors[id])} />
      <FieldError message={errors[id]} />
    </div>
  );

  return (
    <section className={card} aria-labelledby="profile-password">
      <h2 id="profile-password" className="text-2xl font-semibold text-ink-900">Mot de passe</h2>
      <RequiredLegend className="mt-3" />
      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        {field('current', 'Mot de passe actuel', current, setCurrent, 'current-password')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('next', 'Nouveau mot de passe', next, setNext, 'new-password')}
          {field('confirm', 'Confirmer le nouveau', confirm, setConfirm, 'new-password')}
        </div>
        <p className="text-xs text-ink-500">Au moins 8 caractères, avec une minuscule, une majuscule et un chiffre.</p>
        <button type="button" onClick={() => setShow(s => !s)} className="text-sm font-semibold text-brand-700 hover:underline">
          {show ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
        </button>

        <SuccessMessage message={success} />
        <ErrorMessage message={failure} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? <><Spinner />Modification…</> : 'Changer le mot de passe'}
          </button>
          <button type="button" onClick={handleReset} className="text-sm font-semibold text-ink-500 hover:text-brand-700 hover:underline">
            Mot de passe actuel oublié ?
          </button>
        </div>
      </form>
    </section>
  );
};

// ---------- Suppression du compte ----------

const DeleteSection: React.FC<{ onAccountDeleted: () => void }> = ({ onAccountDeleted }) => {
  const { hasPasswordLogin, deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ understood: '', password: '' });
  const [deleting, setDeleting] = useState(false);
  const [failure, setFailure] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFailure('');
    const newErrors = {
      understood: understood ? '' : 'Cochez cette case pour confirmer.',
      password: hasPasswordLogin && !password ? 'Entrez votre mot de passe pour confirmer.' : '',
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setDeleting(true);
    try {
      await deleteAccount(hasPasswordLogin ? password : undefined);
      onAccountDeleted();
    } catch (error: any) {
      if (error.message.startsWith('Mot de passe actuel')) {
        setErrors(p => ({ ...p, password: 'Mot de passe incorrect.' }));
      } else {
        setFailure(error.message);
      }
      setDeleting(false);
    }
  };

  return (
    <section className={`${card} ring-red-200`} aria-labelledby="profile-delete">
      <h2 id="profile-delete" className="flex items-center gap-2 text-2xl font-semibold text-ink-900">
        <TrashIcon className="h-6 w-6 text-red-600" />Supprimer mon compte
      </h2>
      <div className="mt-3 space-y-2 text-sm text-ink-500">
        <p>Seront supprimés définitivement : votre profil, vos favoris, vos alertes « prévenez-moi » et vos notifications.</p>
        <p>Vos commandes déjà passées restent enregistrées chez WAFI pour le suivi des livraisons et la comptabilité.</p>
      </div>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="mt-5 rounded-full border-2 border-red-200 px-6 py-2.5 font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-50">
          Supprimer mon compte…
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <RequiredLegend />
          <div>
            <label className="flex items-start gap-3 text-sm text-ink-900">
              <input type="checkbox" checked={understood} required
                onChange={e => { setUnderstood(e.target.checked); setErrors(p => ({ ...p, understood: '' })); }}
                aria-invalid={!!errors.understood}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-red-600" />
              <span>Je comprends que la suppression est définitive et ne peut pas être annulée.<Required /></span>
            </label>
            <FieldError message={errors.understood} />
          </div>

          {hasPasswordLogin ? (
            <div>
              <label htmlFor="delete-password" className={labelClass}>Mot de passe<Required /></label>
              <input id="delete-password" type="password" value={password} autoComplete="current-password" required
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                aria-invalid={!!errors.password} className={inputClass(!!errors.password)} />
              <FieldError message={errors.password} />
            </div>
          ) : (
            <p className="text-sm text-ink-500">Google vous demandera de confirmer votre identité dans une petite fenêtre.</p>
          )}

          <ErrorMessage message={failure} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-ink-500/30">
              {deleting ? <><Spinner />Suppression…</> : 'Supprimer définitivement mon compte'}
            </button>
            <button type="button" disabled={deleting}
              onClick={() => { setOpen(false); setUnderstood(false); setPassword(''); setErrors({ understood: '', password: '' }); setFailure(''); }}
              className="rounded-full px-6 py-3 font-semibold text-ink-700 hover:bg-ink-900/5">
              Annuler
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

// ---------- Page ----------

const ProfilePage: React.FC<ProfilePageProps> = ({ onAccountDeleted }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sun-200 font-display text-2xl font-semibold text-ink-900">
          {currentUser.firstName?.charAt(0).toUpperCase() || <UserIcon className="h-7 w-7" />}
        </span>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Mon profil</h1>
          <p className="truncate text-sm text-ink-500">{currentUser.email}</p>
        </div>
      </header>

      <InfoSection />
      <PasswordSection />
      {currentUser.role !== 'admin' ? (
        <DeleteSection onAccountDeleted={onAccountDeleted} />
      ) : (
        <p className="flex items-center gap-2 px-2 text-sm text-ink-500">
          <ShieldIcon className="h-4 w-4" />Un compte administrateur ne peut pas être supprimé depuis le site.
        </p>
      )}
    </div>
  );
};

export default ProfilePage;
