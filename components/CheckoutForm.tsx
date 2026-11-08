import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useProduct } from '../context/ProductContext';
import { CartItem } from '../types';
import { WhatsAppIcon } from './icons';
import { checkPhone, splitPhone, PhoneParts } from '../src/utils/phone';
import { validateName, MAX_ADDRESS_LENGTH } from '../src/utils/validation';
import { Required, Optional, RequiredLegend, FieldError, inputClass, labelClass } from './FormParts';
import { PhoneInput } from './PhoneInput';

// Limite imposée par les règles Firestore (vérification du prix de chaque produit)
const MAX_DISTINCT_ITEMS = 10;

interface CheckoutFormProps {
  cartItems: CartItem[];
  totalPrice: number;
  onOrderSuccess: (message: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ cartItems, totalPrice, onOrderSuccess }) => {
  const { currentUser, updateProfile } = useAuth();
  const { addOrder } = useOrder();
  const { products } = useProduct();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: ''
  });
  const [phone, setPhone] = useState<PhoneParts>(() => splitPhone(currentUser?.phone));
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client connecté : proposer d'enregistrer numéro et adresse pour les prochaines commandes
  const isClient = !!currentUser && currentUser.role !== 'admin';
  const [saveToProfile, setSaveToProfile] = useState(!currentUser?.phone);

  // Pré-remplissage avec le profil (sans écraser ce que le client a déjà tapé)
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        firstName: prev.firstName || currentUser.firstName,
        lastName: prev.lastName || currentUser.lastName,
        address: prev.address || currentUser.address || '',
      }));
      if (currentUser.phone) {
        setPhone(prev => (prev.national ? prev : splitPhone(currentUser.phone)));
      }
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhoneChange = (value: PhoneParts) => {
    setPhone(value);
    setErrors(prev => ({ ...prev, phone: '' }));
  };

  // Renvoie le numéro vérifié si tout le formulaire est correct, sinon null (et affiche les erreurs)
  const validateForm = () => {
    const phoneCheck = checkPhone(phone);
    const newErrors = {
      firstName: validateName(formData.firstName, 'prénom'),
      lastName: validateName(formData.lastName, 'nom'),
      phone: phoneCheck.valid ? '' : phoneCheck.error,
    };
    setErrors(newErrors);

    if (cartItems.length > MAX_DISTINCT_ITEMS) {
      alert(`Une commande peut contenir au maximum ${MAX_DISTINCT_ITEMS} produits différents. Passez le reste dans une seconde commande.`);
      return null;
    }
    if (Object.values(newErrors).some(Boolean) || !phoneCheck.valid) return null;
    return phoneCheck;
  };

  const formatOrderMessage = (
    items: { productId: string; name: string; price: number; quantity: number }[],
    total: number,
    phoneDisplay: string
  ) => {
    const customerInfoParts = [
      '*Nouvelle Commande Wafi*',
      '-----------------------------',
      `*Client:* ${formData.firstName.trim()} ${formData.lastName.trim()}`,
      `*Téléphone:* ${phoneDisplay}`
    ];

    if (formData.address.trim()) {
      customerInfoParts.push(`*Adresse:* ${formData.address.trim()}`);
    }

    customerInfoParts.push('-----------------------------');
    const customerInfo = customerInfoParts.join('\n');
    const baseUrl = window.location.origin;

    const orderItems = items.map(item => {
      const productUrl = `${baseUrl}/?product=${item.productId}`;
      return `*${item.name}* (x${item.quantity})\n- Prix: ${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA\n- Lien du produit: ${productUrl}`;
    }).join('\n\n');

    const totalLine = `*TOTAL: ${total.toLocaleString('fr-FR')} FCFA*`;
    const closingMessage = '\nMerci de confirmer la commande et de communiquer les modalités de paiement et de livraison.';

    return `${customerInfo}\n\n*Détails de la commande:*\n\n${orderItems}\n\n-----------------------------\n${totalLine}${closingMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || isSubmitting) return;
    const phoneCheck = validateForm();
    if (!phoneCheck) return;

    setIsSubmitting(true);

    try {
      // Prix du catalogue actuel (le panier peut contenir un ancien prix) : les règles Firestore le vérifient
      const items = cartItems.map(item => ({
        productId: String(item.id),
        name: item.name,
        price: products.find(p => p.id === item.id)?.price ?? item.price,
        quantity: item.quantity
      }));

      const orderData = {
        userId: currentUser?.id || 'guest',
        customer: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: currentUser?.email || '',
          phone: phoneCheck.e164,
          address: formData.address.trim()
        },
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };

      const createdOrder = await addOrder(orderData as any);
      if (!createdOrder) {
        throw new Error('Order creation failed');
      }

      // Enregistrement facultatif dans le profil : un échec ne bloque pas la commande
      if (isClient && saveToProfile) {
        updateProfile({
          firstName: currentUser?.firstName || orderData.customer.firstName,
          lastName: currentUser?.lastName || orderData.customer.lastName,
          phone: phoneCheck.e164,
          address: orderData.customer.address || currentUser?.address || '',
        }).catch(err => console.error('Profil non mis à jour :', err));
      }

      const summary = formatOrderMessage(items, orderData.total, phoneCheck.international);
      onOrderSuccess(summary);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      alert('La commande n\'a pas pu être créée : un prix ou un stock a peut-être changé. Rechargez la page et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <RequiredLegend />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className={labelClass}>Prénom<Required /></label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" aria-invalid={!!errors.firstName} className={inputClass(!!errors.firstName)} />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Nom<Required /></label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" aria-invalid={!!errors.lastName} className={inputClass(!!errors.lastName)} />
          <FieldError message={errors.lastName} />
        </div>
      </div>
      <PhoneInput
        id="phone"
        label="Téléphone (WhatsApp)"
        value={phone}
        onChange={handlePhoneChange}
        required
        error={errors.phone}
        hint="Vous êtes à l’étranger ? Choisissez votre pays : tous les numéros sont acceptés."
      />
      <div>
        <label htmlFor="address" className={labelClass}>Adresse de livraison<Optional /></label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} maxLength={MAX_ADDRESS_LENGTH} placeholder="Cité Keur Gorgui, Lot 123, Dakar" autoComplete="street-address" className={inputClass(false)} />
        <p className="mt-1 text-xs text-ink-500">Vous commandez pour un enfant au Sénégal ? Indiquez l’adresse où livrer.</p>
      </div>
      {isClient && (
        <label className="flex items-start gap-3 text-sm text-ink-700">
          <input type="checkbox" checked={saveToProfile} onChange={e => setSaveToProfile(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-brand-600" />
          <span>Enregistrer ce numéro et cette adresse dans mon profil pour mes prochaines commandes<Optional /></span>
        </label>
      )}
      <button
        type="submit"
        disabled={cartItems.length === 0 || isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 font-semibold text-white shadow-md shadow-[#25D366]/25 transition hover:bg-[#1fb757] disabled:cursor-not-allowed disabled:bg-ink-500/30 disabled:shadow-none"
      >
        {isSubmitting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Création de la commande…
          </>
        ) : (
          <>
            <WhatsAppIcon className="h-5 w-5" />
            Commander via WhatsApp
          </>
        )}
      </button>
      <p className="text-center text-xs text-ink-500">Le paiement et la livraison sont confirmés avec vous sur WhatsApp.</p>
    </form>
  );
};

export default CheckoutForm;
