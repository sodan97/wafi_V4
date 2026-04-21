import React, { useState, useMemo, useRef } from 'react';
import { useOrder } from '../context/OrderContext';
import { useProduct } from '../context/ProductContext';
import { useReservation } from '../context/ReservationContext';
import { useAuth } from '../context/AuthContext';
import { SearchIcon, PlusIcon, TrashIcon, EditIcon } from '../constants';
import DataTable from './DataTable';
import AddProductModal from './AddProductModal';
import EditProductModal from './EditProductModal';
import { Product } from '../types';

const ProductManager: React.FC = () => {
    const { products, updateProductStock, updateProductStatus, deleteProduct, restoreProduct, permanentlyDeleteProduct } = useProduct();
    const [stockLevels, setStockLevels] = useState<Record<string, string>>({});
    const [notification, setNotification] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
    const [generalNotification, setGeneralNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'actifs' | 'archives' | 'corbeille'>('actifs');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'custom'>('all');
    const [customStockMin, setCustomStockMin] = useState<string>('');
    const [customStockMax, setCustomStockMax] = useState<string>('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const notificationTimeoutRef = useRef<number | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        setGeneralNotification({ message, type });
        notificationTimeoutRef.current = window.setTimeout(() => {
            setGeneralNotification(null);
        }, 4000);
    };

    const handleStockChange = (productId: string, value: string) => {
        setStockLevels(prev => ({ ...prev, [productId]: value }));
    };

    const handleUpdateClick = (productId: string) => {
        const newStockValue = stockLevels[productId];
        if (newStockValue === undefined || newStockValue.trim() === '') return;

        const newStock = parseInt(newStockValue, 10);
        if (!isNaN(newStock) && newStock >= 0) {
            updateProductStock(productId, newStock);
            setNotification({ id: productId, message: 'Stock mis à jour !', type: 'success' });
            setStockLevels(prev => {
                const newState = { ...prev };
                delete newState[productId];
                return newState;
            });
            setTimeout(() => setNotification(null), 2500);
        } else {
            setNotification({ id: productId, message: 'Valeur invalide', type: 'error' });
            setTimeout(() => setNotification(null), 2500);
        }
    };

    const handleDelete = async (product: Product) => {
        if (window.confirm(`Voulez-vous vraiment déplacer le produit \"${product.name}\" vers la corbeille ? Il ne sera plus visible par les clients mais pourra être restauré.`)) {
            try {
                await deleteProduct(product.id);
                showNotification(`Le produit \"${product.name}\" a été déplacé vers la corbeille.`);
            } catch (error) {
                showNotification(`Erreur lors du déplacement vers la corbeille.`, 'error');
            }
        }
    };

    const handleRestore = async (product: Product) => {
        try {
            await restoreProduct(product.id);
            showNotification(`Le produit \"${product.name}\" a été restauré.`);
        } catch (error) {
            showNotification(`Erreur lors de la restauration du produit.`, 'error');
        }
    };

    const handlePermanentDelete = async (product: Product) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT le produit \"${product.name}\" ? Cette action est irréversible.`)) {
            try {
                await permanentlyDeleteProduct(product.id);
                showNotification(`Le produit \"${product.name}\" a été supprimé définitivement.`, 'error');
            } catch (error) {
                showNotification(`Erreur lors de la suppression définitive.`, 'error');
            }
        }
    };

    const handleArchive = async (product: Product) => {
        try {
            await updateProductStatus(product.id, 'archived');
            showNotification(`Le produit \"${product.name}\" a été archivé.`);
        } catch (error) {
            showNotification(`Erreur lors de l'archivage du produit.`, 'error');
        }
    };

    const handleReactivate = async (product: Product) => {
        try {
            await updateProductStatus(product.id, 'active');
            showNotification(`Le produit \"${product.name}\" a été réactivé.`);
        } catch (error) {
            showNotification(`Erreur lors de la réactivation du produit.`, 'error');
        }
    };

    const getStockColor = (stock: number) => {
        if (stock === 0) return 'text-red-600 bg-red-100';
        if (stock <= 10) return 'text-orange-600 bg-orange-100';
        return 'text-green-600 bg-green-100';
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => {
                if (statusFilter === 'actifs') return p.status === 'active';
                if (statusFilter === 'archives') return p.status === 'archived';
                if (statusFilter === 'corbeille') return p.status === 'deleted';
                return false;
            })
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(p => {
                if (stockFilter === 'all') return true;
                if (stockFilter === 'low') return p.stock >= 0 && p.stock <= 10;
                if (stockFilter === 'medium') return p.stock > 10 && p.stock <= 50;
                if (stockFilter === 'high') return p.stock > 50;
                if (stockFilter === 'custom') {
                    const min = customStockMin ? parseInt(customStockMin) : 0;
                    const max = customStockMax ? parseInt(customStockMax) : Infinity;
                    return p.stock >= min && p.stock <= max;
                }
                return true;
            });
    }, [products, searchTerm, statusFilter, stockFilter, customStockMin, customStockMax]);

    const stockStats = useMemo(() => {
        const activeProducts = products.filter(p => p.status === 'active');
        return {
            outOfStock: activeProducts.filter(p => p.stock === 0).length,
            lowStock: activeProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
            mediumStock: activeProducts.filter(p => p.stock > 10 && p.stock <= 50).length,
            highStock: activeProducts.filter(p => p.stock > 50).length,
        };
    }, [products]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            {generalNotification && (
                <div
                    className={`p-4 mb-6 rounded-lg text-white font-semibold text-center ${generalNotification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                    role="alert"
                >
                    {generalNotification.message}
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Gestion des Produits</h3>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full sm:w-auto bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 transition-colors shadow flex items-center justify-center gap-2"
                >
                    <span className="pointer-events-none flex items-center gap-2">
                      <PlusIcon className="w-5 h-5" />
                      Ajouter un produit
                    </span>
                </button>
            </div>

            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-600 font-semibold">Rupture de stock</p>
                    <p className="text-2xl font-bold text-red-700">{stockStats.outOfStock}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-orange-600 font-semibold">Stock faible (1-10)</p>
                    <p className="text-2xl font-bold text-orange-700">{stockStats.lowStock}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-semibold">Stock moyen (11-50)</p>
                    <p className="text-2xl font-bold text-blue-700">{stockStats.mediumStock}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-600 font-semibold">Stock élevé (50+)</p>
                    <p className="text-2xl font-bold text-green-700">{stockStats.highStock}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4 items-center flex-wrap">
                <div className="relative flex-grow w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Rechercher par nom..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                 <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-600">Statut:</span>
                    <button onClick={() => setStatusFilter('actifs')} className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'actifs' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Actifs</button>
                    <button onClick={() => setStatusFilter('archives')} className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'archives' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>Archivés</button>
                    <button onClick={() => setStatusFilter('corbeille')} className={`px-3 py-1 text-sm rounded-full ${statusFilter === 'corbeille' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Corbeille</button>
                </div>
            </div>

            <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <span className="font-semibold text-sm text-gray-700">Filtre de stock:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setStockFilter('all')}
                            className={`px-3 py-1 text-sm rounded-full transition ${stockFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setStockFilter('low')}
                            className={`px-3 py-1 text-sm rounded-full transition ${stockFilter === 'low' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        >
                            Faible (0-10)
                        </button>
                        <button
                            onClick={() => setStockFilter('medium')}
                            className={`px-3 py-1 text-sm rounded-full transition ${stockFilter === 'medium' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            Moyen (11-50)
                        </button>
                        <button
                            onClick={() => setStockFilter('high')}
                            className={`px-3 py-1 text-sm rounded-full transition ${stockFilter === 'high' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        >
                            Élevé (50+)
                        </button>
                        <button
                            onClick={() => setStockFilter('custom')}
                            className={`px-3 py-1 text-sm rounded-full transition ${stockFilter === 'custom' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                        >
                            Personnalisé
                        </button>
                    </div>
                </div>

                {stockFilter === 'custom' && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <span className="text-sm text-gray-600">Quantité entre:</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={customStockMin}
                            onChange={(e) => setCustomStockMin(e.target.value)}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                            min="0"
                        />
                        <span className="text-sm text-gray-600">et</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={customStockMax}
                            onChange={(e) => setCustomStockMax(e.target.value)}
                            className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                            min="0"
                        />
                        <span className="text-sm text-gray-500">
                            ({filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''})
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {filteredProducts.map(product => (
                    <div key={product.id} className={`bg-gray-50 rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg ${product.status !== 'active' ? 'opacity-70' : ''}`}>
                        <div className="relative h-48 overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0" style={{ backgroundImage: `url(${product.imageUrls[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                            <img src={product.imageUrls[0]} alt={product.name} className="relative z-10 w-full h-full object-contain" />
                            {product.status !== 'active' && (
                                <div className={`absolute top-2 left-2 z-20 text-white text-xs font-bold px-2 py-1 rounded ${
                                    product.status === 'archived' ? 'bg-yellow-500' : 'bg-red-600'
                                }`}>
                                    {product.status.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">{product.category}</p>
                            <h4 className="font-bold text-lg text-gray-800 mt-1 mb-3 flex-grow">{product.name}</h4>
                            
                            <div className="flex justify-between items-center mb-4">
                               <span className="text-sm text-gray-600">Stock actuel :</span>
                               <span className={`font-bold px-2.5 py-1 rounded-md text-sm ${getStockColor(product.stock)}`}>
                                    {product.stock} unités
                               </span>
                            </div>

                            <div className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    placeholder="Nouveau stock"
                                    value={stockLevels[product.id] ?? ''}
                                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                                    min="0"
                                    aria-label={`Nouveau stock pour ${product.name}`}
                                />
                                <button
                                    onClick={() => handleUpdateClick(product.id)}
                                    className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    disabled={stockLevels[product.id] === undefined || stockLevels[product.id].trim() === ''}
                                >
                                    OK
                                </button>
                            </div>
                             {notification && notification.id === product.id && (
                                <p className={`text-sm mt-2 text-center font-semibold ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                  {notification.message}
                                </p>
                            )}

                             <div className="flex justify-around items-center mt-4 pt-4 border-t border-gray-200">
                                {product.status === 'deleted' ? (
                                    <>
                                        <button onClick={() => handleRestore(product)} className="text-sm font-semibold text-green-600 hover:text-green-800">Restaurer</button>
                                        <button onClick={() => handlePermanentDelete(product)} className="text-sm font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">
                                            <span className="pointer-events-none flex items-center gap-1">
                                                <TrashIcon className="w-4 h-4" />
                                                Supprimer Déf.
                                            </span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingProduct(product)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <span className="pointer-events-none flex items-center gap-1">
                                                <EditIcon className="w-4 h-4"/>
                                                Modifier
                                            </span>
                                        </button>
                                        {product.status === 'active' ? (
                                            <button onClick={() => handleArchive(product)} className="text-sm font-semibold text-yellow-600 hover:text-yellow-800">Archiver</button>
                                        ) : (
                                            <button onClick={() => handleReactivate(product)} className="text-sm font-semibold text-green-600 hover:text-green-800">Réactiver</button>
                                        )}
                                        <button onClick={() => handleDelete(product)} className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1">
                                            <span className="pointer-events-none flex items-center gap-1">
                                                <TrashIcon className="w-4 h-4" />
                                                Corbeille
                                            </span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {filteredProducts.length === 0 && <p className="text-center text-gray-500 py-12">Aucun produit ne correspond à vos critères.</p>}
            {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} />}
            {editingProduct && <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
        </div>
    );
}

const OrderManager: React.FC = () => {
    const { orders, updateOrderStatus, isLoading, error } = useOrder();
    const { users } = useAuth();

    const getRowClassName = (row: any) => {
        const status = row.status;
        if (status === 'Pas commencé') {
            return 'bg-yellow-100';
        } else if (status === 'En traitement') {
            return 'bg-blue-100';
        } else if (status === 'Terminée') {
            return 'bg-green-100';
        }
        return '';
    };

    const columns = useMemo(() => [
        { Header: 'ID Commande', accessor: 'id' as const },
        { Header: 'Prénom', accessor: 'firstName' as const },
        { Header: 'Nom', accessor: 'lastName' as const },
        { Header: 'Email Client', accessor: 'email' as const },
        { Header: 'Téléphone', accessor: 'phone' as const },
        { Header: 'Date', accessor: 'date' as const, isDate: true },
        { Header: 'Heure', accessor: 'time' as const, isTime: true },
        { Header: 'Prix (FCFA)', accessor: 'total' as const, isNumeric: true },
        { Header: 'Articles', accessor: 'items' as const },
        {
            Header: 'Traité par',
            accessor: 'handledByName' as const,
            filterOptions: ['Mous', 'Moh', 'Na'],
            Cell: ({ value, row }) => {
                return (
                    <select
                        value={value || ''}
                        onChange={(e) => {
                            updateOrderStatus(row.original._id, row.original.status, e.target.value);
                        }}
                        className="border border-gray-300 rounded px-2 py-1"
                    >
                        <option value="">-</option>
                        <option value="Mous">Mous</option>
                        <option value="Moh">Moh</option>
                        <option value="Na">Na</option>
                    </select>
                );
            }
        },
        {
            Header: 'Statut',
            accessor: 'status' as const,
            filterOptions: ['Pas commencé', 'En traitement', 'Terminée'],
            Cell: ({ value, row }) => {
                const getStatusColor = (status: string) => {
                    if (status === 'Pas commencé') return 'bg-yellow-200 text-yellow-900 border-yellow-400';
                    if (status === 'En traitement') return 'bg-blue-200 text-blue-900 border-blue-400';
                    if (status === 'Terminée') return 'bg-green-200 text-green-900 border-green-400';
                    return 'bg-gray-100 text-gray-900 border-gray-300';
                };

                return (
                    <select
                        value={value || 'Pas commencé'}
                        onChange={(e) => {
                            updateOrderStatus(row.original._id, e.target.value, row.original.handledByName);
                        }}
                        className={`border rounded px-2 py-1 font-semibold ${getStatusColor(value || 'Pas commencé')}`}
                    >
                        <option value="Pas commencé">Pas commencé</option>
                        <option value="En traitement">En traitement</option>
                        <option value="Terminée">Terminée</option>
                    </select>
                );
            }
        },
    ], [updateOrderStatus]);

    const data = useMemo(() => orders.map(order => {
        const user = users.find(u => u.id === order.userId);
        return {
            id: order._id?.slice(-6).toUpperCase() ?? '',
            _id: order._id,
            firstName: order.customer?.firstName,
            lastName: order.customer.lastName,
            email: order.customer?.email || user?.email || '-',
            phone: order.customer.phone,
            date: new Date(order.date).toLocaleDateString('fr-FR'),
            time: new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            total: order.total.toLocaleString('fr-FR'),
            items: order.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
            status: order.status || 'Pas commencé',
            handledByName: order.handledByName || '-',
        };
    }), [orders, users]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Historique des Commandes</h3>
            {isLoading ? (
                <p className="text-center text-gray-500 py-12">Chargement des commandes...</p>
            ) : error ? (
                <p className="text-center text-red-600 py-12">Erreur lors du chargement des commandes : {error}</p>
            ) : (
                <DataTable columns={columns} data={data} exportFilename="commandes_belleza" getRowClassName={getRowClassName} />
            )}
        </div>
    );
}

// Assuming you might have a separate component for Order History if needed elsewhere
// For now, the OrderManager component serves this purpose within AdminPage.
// If you had a separate OrderHistoryPage component, you would apply similar logic there.
const OrderHistoryPage: React.FC = () => {
     // If this were a separate component, you'd fetch and display orders here.
     // Since OrderManager is used within AdminPage, this component is not directly used.
     return (
         <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
             <h3 className="text-2xl font-bold mb-4">Order History Page Placeholder</h3>
             {/* Content would go here */}
        </div>
    );
}

const ReservationManager: React.FC = () => {
    const { reservations } = useReservation();
    const { products } = useProduct();
    const { users } = useAuth();
    const { orders } = useOrder();

    const columns = useMemo(() => [
        { Header: 'Produit Réservé', accessor: 'productName' as const },
        { Header: 'Prénom', accessor: 'firstName' as const },
        { Header: 'Nom', accessor: 'lastName' as const },
        { Header: 'Email Client', accessor: 'email' as const },
        { Header: 'Téléphone', accessor: 'phone' as const },
        { Header: 'Date Demande', accessor: 'reservationDate' as const },
    ], []);

    const data = useMemo(() => {
        return reservations.map(res => {
            const product = products.find(p => p.id === res.productId);
            const user = users.find(u => u.id === res.userId);
            
            const userOrders = orders
                .filter(o => o.userId === res.userId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
                const userPhone = userOrders.length > 0 ? userOrders[0]?.customer?.phone ?? 'N/A' : 'N/A';


            return {
                productName: product?.name ?? 'Inconnu',
                firstName: user?.firstName ?? 'Inconnu',
                lastName: user?.lastName ?? 'Inconnu',
                email: user?.email ?? 'Inconnu',
                phone: userPhone,
                reservationDate: new Date(res.date).toLocaleDateString('fr-FR'),
            };
        });
    }, [reservations, products, users, orders]);

    return (
         <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4">Produits Réservés (en attente de stock)</h3>
             <DataTable columns={columns} data={data} exportFilename="reservations_belleza" />
        </div>
    );
}


const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('products');

    const TABS = [
        { id: 'products', label: 'Gestion des Produits' },
        { id: 'reservations', label: 'Gestion des Réservations' },
        { id: 'orders', label: 'Historique des Commandes' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">Panneau d'Administration</h2>

            <div className="flex border-b border-gray-200 mb-6 flex-wrap">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-6 font-semibold text-center transition-colors duration-200 ${activeTab === tab.id ? 'border-b-2 border-rose-500 text-rose-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="transition-opacity duration-300">
                {activeTab === 'products' && <ProductManager />}
                {activeTab === 'reservations' && <ReservationManager />}
                {activeTab === 'orders' && <OrderManager />}
            </div>
        </div>
    );
};

export default AdminPage;
