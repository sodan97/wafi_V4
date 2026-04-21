import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import CheckoutForm from './CheckoutForm';
import { QRCodeCanvas } from 'qrcode.react';
import { MERCHANT_WHATSAPP_NUMBER } from '../constants';

interface CartViewProps {
  onContinueShopping: () => void;
}

const CartView: React.FC<CartViewProps> = ({ onContinueShopping }) => {
  const { cartItems, updateQuantity, removeFromCart, itemCount, clearCart } = useCart();
  const [checkoutState, setCheckoutState] = useState<{ isSubmitted: boolean; whatsappUrl: string }>({
    isSubmitted: false,
    whatsappUrl: ''
  });

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleOrderSuccess = (message: string) => {
    const fullUrl = `https://wa.me/${MERCHANT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    setCheckoutState({ isSubmitted: true, whatsappUrl: fullUrl });
    clearCart();
  };



  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );

  const MinusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );

  if (checkoutState.isSubmitted) {
    return (
        <div className="text-center bg-green-50 p-6 sm:p-8 rounded-lg transition-all duration-500 ease-in-out border border-green-200 max-w-lg mx-auto">
            <h3 className="text-2xl font-bold text-green-800">Lien WhatsApp généré</h3>
            <p className="mt-2 text-gray-700">Scannez ce QR code avec votre téléphone ou cliquez sur le bouton pour ouvrir WhatsApp Web.</p>
            <div className="my-6 flex justify-center bg-white p-4 rounded-lg shadow-inner">
                <QRCodeCanvas value={checkoutState.whatsappUrl} size={200} fgColor="#15803d" />
            </div>
            <p className="text-gray-600 mb-4 text-sm">Pour copier le lien :</p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={() => navigator.clipboard.writeText(checkoutState.whatsappUrl)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition"
              >
                Copier le lien
              </button>
              <a
                href={checkoutState.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300"
              >
                Ouvrir WhatsApp Web
              </a>
            </div>
            <button onClick={onContinueShopping} className="mt-6 block mx-auto text-rose-600 hover:text-rose-700 font-semibold">
                Retourner à la boutique
            </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Votre Panier</h2>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <h3 className="text-xl text-gray-600 mb-4">Votre panier est vide</h3>
          <button
            onClick={onContinueShopping}
            className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 transition-colors"
          >
            Continuer mes achats
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
                <img src={item.imageUrls[0]} alt={item.name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-rose-500 font-bold">{item.price.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    <MinusIcon />
                  </button>
                  <span className="px-3 py-1 bg-gray-100 rounded">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  >
                    <PlusIcon />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h3 className="text-xl font-bold mb-4">Résumé de la commande</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Articles ({itemCount})</span>
                <span>{totalPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>{totalPrice.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <CheckoutForm
              cartItems={cartItems}
              totalPrice={totalPrice}
              onOrderSuccess={handleOrderSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartView;