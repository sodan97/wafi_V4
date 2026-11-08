import React from 'react';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from './ProductCard';
import { PackageIcon } from './icons';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'bg-sun-100 text-ink-900' },
    'Pas commencé': { label: 'En attente', className: 'bg-sun-100 text-ink-900' },
    'En traitement': { label: 'En préparation', className: 'bg-brand-50 text-brand-700' },
    'Terminée': { label: 'Terminée', className: 'bg-brand-600 text-white' },
};

const OrderHistoryPage: React.FC = () => {
    const { orders } = useOrder();
    const { currentUser } = useAuth();

    const userOrders = currentUser
        ? orders.filter(order => order.userId === currentUser.id)
        : [];

    return (
        <div className="mx-auto max-w-3xl animate-fade-in">
            <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">Mes commandes</h1>
            {userOrders.length === 0 ? (
                <div className="mt-6 rounded-[2rem] bg-white px-6 py-16 text-center ring-1 ring-ink-900/5">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sun-100 text-ink-900">
                        <PackageIcon className="h-8 w-8" />
                    </span>
                    <p className="mt-5 font-display text-xl font-semibold text-ink-900">Aucune commande pour l’instant</p>
                    <p className="mt-2 text-ink-500">Vos commandes apparaîtront ici.</p>
                </div>
            ) : (
                <ul className="mt-6 space-y-4">
                    {userOrders.map(order => {
                        const status = STATUS_LABELS[order.status] || { label: order.status, className: 'bg-cream text-ink-700' };
                        return (
                            <li key={order.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink-900/5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-display text-lg font-semibold text-ink-900">Commande #{order.id.slice(-6).toUpperCase()}</p>
                                        <p className="mt-0.5 text-xs text-ink-500">
                                            {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                                </div>
                                <ul className="mt-4 space-y-1.5 border-t border-ink-900/5 pt-4 text-sm text-ink-700">
                                    {order.items.map((item, index) => (
                                        <li key={index} className="flex justify-between gap-3">
                                            <span className="first-letter:uppercase">{item.name} <span className="text-ink-500">× {item.quantity}</span></span>
                                            <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 flex items-baseline justify-between border-t border-ink-900/5 pt-3">
                                    <span className="text-sm font-semibold text-ink-700">Total</span>
                                    <span className="font-display text-xl font-semibold text-ink-900">{formatPrice(order.total)}</span>
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default OrderHistoryPage;
