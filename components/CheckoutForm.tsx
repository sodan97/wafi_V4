import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrder } from '../context/OrderContext';
import { CartItem } from '../types';

interface CheckoutFormProps {
  cartItems: CartItem[];
  totalPrice: number;
  onOrderSuccess: (message: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ cartItems, totalPrice, onOrderSuccess }) => {
  const { currentUser } = useAuth();
  const { addOrder } = useOrder();

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
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'Le numéro de téléphone ne doit contenir que des chiffres.';
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

  const formatOrderMessage = () => {
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

    const orderItems = cartItems.map(item => {
      const productUrl = `${baseUrl}/product/${item.id}`;
      return `*${item.name}* (x${item.quantity})\n- Prix: ${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA\n- Lien du produit: ${productUrl}`;
    }).join('\n\n');

    const totalLine = `*TOTAL: ${totalPrice.toLocaleString('fr-FR')} FCFA*`;
    const closingMessage = '\nMerci de confirmer la commande et de communiquer les modalités de paiement et de livraison.';

    return `${customerInfo}\n\n*Détails de la commande:*\n\n${orderItems}\n\n-----------------------------\n${totalLine}${closingMessage}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || cartItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const orderData = {
        userId: currentUser?.id || 'guest',
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: currentUser?.email || '',
          phone: formData.phone,
          address: formData.address
        },
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: totalPrice
      };

      await addOrder(orderData);

      const summary = formatOrderMessage();
      onOrderSuccess(summary);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      alert('Une erreur est survenue lors de la création de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse Complète</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Ex: Cité Keur Gorgui, Lot 123, Dakar"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Numéro de Téléphone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="Ex: 771234567"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>
      <div className="text-center pt-4">
        <button
          type="submit"
          disabled={!isFormCurrentlyValid || cartItems.length === 0 || isSubmitting}
          className="w-full sm:w-auto bg-rose-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-rose-600 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création en cours...
            </span>
          ) : (
            'Générer le lien WhatsApp'
          )}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;