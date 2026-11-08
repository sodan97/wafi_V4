import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { useProduct } from '../context/ProductContext';
import { CartItem } from '../types';
import { WhatsAppIcon } from './icons';

// Mobiles (70, 75, 76, 77, 78) et fixes (33) sénégalais, avec ou sans indicatif +221
const SENEGAL_PHONE_REGEX = /^(\+221)?(7[05678]|33)\d{7}$/;
// Limite imposée par les règles Firestore (vérification du prix de chaque produit)
const MAX_DISTINCT_ITEMS = 10;

const normalizePhone = (phone: string) => phone.replace(/[\s.-]/g, '').replace(/^00221/, '+221');

interface CheckoutFormProps {
  cartItems: CartItem[];
  totalPrice: number;
  onOrderSuccess: (message: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ cartItems, totalPrice, onOrderSuccess }) => {
  const { currentUser } = useAuth();
  const { addOrder } = useOrder();
  const { products } = useProduct();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
      }));
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear previous error for the field when it's changed
    setErrors(prev => ({ ...prev, [name]: '' }));
  };
  
  const validateForm = () => {
    const newErrors = { firstName: '', lastName: '', address: '', phone: '' };
    let isValid = true;

    // First Name validation: only letters and spaces, not empty
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis.';
      isValid = false;
    } else if (!/^[a-zA-Z\sÀàÂâÄäÈèÉéÊêËëÎîÏïÔôÖöÙùÛûÜüÇç'-]+$/.test(formData.firstName)) {
      newErrors.firstName = 'Le prénom ne doit contenir que des lettres.';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis.';
      isValid = false;
    } else if (!/^[a-zA-Z\sÀàÂâÄäÈèÉéÊêËëÎîÏïÔôÖöÙùÛûÜüÇç'-]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Le nom ne doit contenir que des lettres.';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis.';
      isValid = false;
    } else if (!SENEGAL_PHONE_REGEX.test(normalizePhone(formData.phone))) {
      newErrors.phone = 'Numéro invalide. Exemple : 77 123 45 67 ou +221 77 123 45 67.';
      isValid = false;
    }

    if (cartItems.length > MAX_DISTINCT_ITEMS) {
      alert(`Une commande peut contenir au maximum ${MAX_DISTINCT_ITEMS} produits différents. Passez le reste dans une seconde commande.`);
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const isFormCurrentlyValid =
    !errors.firstName &&
    !errors.lastName &&
    !errors.phone &&
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.phone.trim() !== '';

  const formatOrderMessage = (items: { productId: string; name: string; price: number; quantity: number }[], total: number) => {
    const customerInfoParts = [
      '*Nouvelle Commande Wafi*',
      '-----------------------------',
      `*Client:* ${formData.firstName} ${formData.lastName}`,
      `*Téléphone:* ${formData.phone}`
    ];

    if (formData.address) {
      customerInfoParts.push(`*Adresse:* ${formData.address}`);
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
    if (!validateForm() || cartItems.length === 0 || isSubmitting) return;

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
          phone: normalizePhone(formData.phone),
          address: formData.address.trim()
        },
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      };

      const createdOrder = await addOrder(orderData as any);
      if (!createdOrder) {
        throw new Error('Order creation failed');
      }

      const summary = formatOrderMessage(items, orderData.total);
      onOrderSuccess(summary);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      alert('La commande n\'a pas pu être créée : un prix ou un stock a peut-être changé. Rechargez la page et réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputClass = (hasError: boolean) =>
    `mt-1.5 block w-full rounded-xl border-0 bg-cream px-4 py-3 text-ink-900 ring-1 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 ${hasError ? 'ring-red-400 focus:ring-red-500' : 'ring-ink-900/10 focus:ring-brand-400'}`;
  const labelClass = 'block text-sm font-semibold text-ink-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className={labelClass}>Prénom</label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required autoComplete="given-name" className={inputClass(!!errors.firstName)} />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Nom</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required autoComplete="family-name" className={inputClass(!!errors.lastName)} />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>Téléphone (WhatsApp)</label>
        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="77 123 45 67" autoComplete="tel" inputMode="tel" className={inputClass(!!errors.phone)} />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="address" className={labelClass}>Adresse de livraison <span className="font-normal text-ink-500">(facultatif)</span></label>
        <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Cité Keur Gorgui, Lot 123, Dakar" autoComplete="street-address" className={inputClass(false)} />
      </div>
      <button
        type="submit"
        disabled={!isFormCurrentlyValid || cartItems.length === 0 || isSubmitting}
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
