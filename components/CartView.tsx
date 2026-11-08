import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import CheckoutForm from './CheckoutForm';
import { QRCodeCanvas } from 'qrcode.react';
import { MERCHANT_WHATSAPP_NUMBER } from '../constants';
import { formatPrice } from './ProductCard';
import { CartIcon, CheckIcon, MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon, ArrowLeftIcon } from './icons';

interface CartViewProps {
  onContinueShopping: () => void;
}

const CartView: React.FC<CartViewProps> = ({ onContinueShopping }) => {
  const { cartItems, updateQuantity, removeFromCart, itemCount, clearCart } = useCart();
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleOrderSuccess = (message: string) => {
    setWhatsappUrl(`https://wa.me/${MERCHANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);
    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = async () => {
    if (!whatsappUrl) return;
    try {
      await navigator.clipboard.writeText(whatsappUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible : le bouton WhatsApp reste utilisable
    }
  };

  if (whatsappUrl) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in rounded-[2rem] bg-white p-6 text-center ring-1 ring-ink-900/5 sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-3xl font-semibold text-ink-900">Commande enregistrée</h2>
        <p className="mt-2 text-ink-500">Dernière étape : envoyez-nous le message WhatsApp pour confirmer le paiement et la livraison.</p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-4 font-semibold text-white shadow-md shadow-[#25D366]/25 transition hover:bg-[#1fb757]"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Envoyer sur WhatsApp
        </a>

        <div className="mt-8 hidden rounded-3xl bg-cream p-5 sm:block">
          <p className="text-sm font-semibold text-ink-700">Sur ordinateur ? Scannez avec votre téléphone</p>
          <div className="mt-4 inline-flex rounded-2xl bg-white p-3">
            <QRCodeCanvas value={whatsappUrl} size={168} fgColor="#17365d" />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <button onClick={handleCopy} className="font-semibold text-ink-700 hover:text-brand-700">
            {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
          <button onClick={onContinueShopping} className="font-semibold text-brand-700 hover:underline">
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white px-6 py-16 text-center ring-1 ring-ink-900/5">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun-100 text-ink-900">
          <CartIcon className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-3xl font-semibold text-ink-900">Votre panier est vide</h2>
        <p className="mt-2 text-ink-500">Des robots, des éoliennes et des voitures attendent vos petits ingénieurs.</p>
        <button onClick={onContinueShopping} className="mt-7 rounded-full bg-brand-600 px-7 py-3 font-semibold text-white hover:bg-brand-700">
          Découvrir les jouets
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button onClick={onContinueShopping} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-brand-700">
        <ArrowLeftIcon className="h-5 w-5" />
        Continuer mes achats
      </button>
      <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">
        Mon panier <span className="text-ink-500">({itemCount})</span>
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <ul className="space-y-3">
          {cartItems.map(item => (
            <li key={item.id} className="flex gap-4 rounded-3xl bg-white p-3 ring-1 ring-ink-900/5 sm:p-4">
              <div className="h-24 w-24 shrink-0 rounded-2xl bg-cream p-2 sm:h-28 sm:w-28">
                <img src={item.imageUrls[0]} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-sans text-sm font-semibold text-ink-900 first-letter:uppercase sm:text-base">{item.name}</h2>
                  <button onClick={() => removeFromCart(item.id)} className="-mr-1 -mt-1 rounded-full p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600" aria-label={`Retirer ${item.name} du panier`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-ink-500">{formatPrice(item.price)} l’unité</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full bg-cream p-0.5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-white" aria-label="Diminuer la quantité">
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-700 hover:bg-white disabled:opacity-30" aria-label="Augmenter la quantité">
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="font-display text-lg font-semibold text-ink-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="rounded-3xl bg-white p-5 ring-1 ring-ink-900/5 sm:p-6 lg:sticky lg:top-28">
          <h2 className="text-xl font-semibold text-ink-900">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-700">
              <dt>Articles ({itemCount})</dt>
              <dd>{formatPrice(totalPrice)}</dd>
            </div>
            <div className="flex justify-between text-ink-700">
              <dt>Livraison</dt>
              <dd className="text-ink-500">Confirmée sur WhatsApp</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-900/5 pt-3">
              <dt className="font-semibold text-ink-900">Total</dt>
              <dd className="font-display text-2xl font-semibold text-ink-900">{formatPrice(totalPrice)}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-ink-900/5 pt-6">
            <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-wider text-ink-500">Vos coordonnées</h3>
            <CheckoutForm cartItems={cartItems} totalPrice={totalPrice} onOrderSuccess={handleOrderSuccess} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CartView;
