import React, { useState, useMemo, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { ArrowLeftIcon } from '../constants';

interface ProductDetailPageProps {
    productId: string;
    onBack: () => void;
    navigateToProductPage: (id: string) => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onBack, navigateToProductPage }) => {
    const { products, activeProducts } = useProduct();
    const { addToCart, cartItems } = useCart();
    const { currentUser } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [isAdded, setIsAdded] = useState(false);
    const [showVideo, setShowVideo] = useState(false);

    const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
    const [selectedImage, setSelectedImage] = useState(product?.imageUrls[0] || '');
    const isInCart = cartItems.some(item => item.id === productId);

    useEffect(() => {
        setIsAdded(false);
    }, [productId]);

    const getYoutubeEmbedUrl = (url: string) => {
        const regExp = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regExp);
        return match ? `https://www.youtube.com/embed/${match[1]}` : null;
    };

    useEffect(() => {
        if (product) {
            setSelectedImage(product.imageUrls[0]);
            setShowVideo(false);
            // Scroll to top when product changes
            window.scrollTo(0, 0);
        }
    }, [product]);

    if (!product || product.status === 'deleted') {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-gray-600">Produit non trouvé.</p>
                <button onClick={onBack} className="mt-4 text-rose-600 hover:underline">Retourner à la boutique</button>
            </div>
        );
    }

    const isUnavailable = product.status === 'archived';
    const isOutOfStock = product.stock <= 0;
    const canAddToCart = !isOutOfStock && !isUnavailable;
    const isProductFavorite = isFavorite(product.id);

    const handleAddToCart = () => {
        if (!canAddToCart) return;
        addToCart(product);
        setIsAdded(true);
        // Le bouton reste vert après l'ajout (pas de retour au rose)
    };

    const handleToggleFavorite = () => {
        toggleFavorite(product.id);
    };

    const recommendedProducts = activeProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 6);

    return (
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl animate-fadeIn">
             <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-rose-600 font-semibold mb-6">
                <ArrowLeftIcon className="w-5 h-5" />
                Retour
            </button>
            {/* Grille 2 colonnes TOUJOURS côte à côte */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Image Gallery - Gauche */}
                <div className="flex flex-col">
                    {product.videoUrl && (
                        <div className="flex gap-2 mb-2">
                            <button
                                onClick={() => setShowVideo(false)}
                                className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${!showVideo ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                📷 Photos
                            </button>
                            <button
                                onClick={() => setShowVideo(true)}
                                className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-all ${showVideo ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                🎬 Vidéo
                            </button>
                        </div>
                    )}
                    <div className="w-full h-64 sm:h-80 md:h-96 rounded-lg shadow-lg overflow-hidden relative border border-gray-100 flex items-center justify-center">
                        {showVideo && product.videoUrl ? (
                            getYoutubeEmbedUrl(product.videoUrl) ? (
                                <iframe
                                    src={getYoutubeEmbedUrl(product.videoUrl) || ''}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`Vidéo ${product.name}`}
                                />
                            ) : (
                                <video
                                    src={product.videoUrl}
                                    className="w-full h-full"
                                    controls
                                    title={`Vidéo ${product.name}`}
                                />
                            )
                        ) : (
                            <>
                                <div className="absolute inset-0" style={{ backgroundImage: `url(${selectedImage})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                                <img src={selectedImage} alt={product.name} className="relative z-10 w-full h-full object-contain transition-transform duration-300 hover:scale-105" />
                                {isUnavailable && (
                                    <div className="absolute top-4 left-4 z-20 bg-yellow-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">ARCHIVÉ</div>
                                )}
                            </>
                        )}
                    </div>
                    {!showVideo && (
                        <div className="flex gap-1 sm:gap-2 justify-center mt-2 sm:mt-4">
                            {product.imageUrls.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(img)}
                                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-all relative ${selectedImage === img ? 'border-rose-500 scale-105' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <div className="absolute inset-0" style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(4px)', transform: 'scale(1.1)' }} />
                                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="relative z-10 w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info - Droite */}
                <div className="flex flex-col justify-between">
                    <div>
                        <span className="text-xs sm:text-sm font-semibold text-rose-500 uppercase tracking-wider">{product.category}</span>
                        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 my-1 sm:my-2 md:my-3">{product.name}</h1>
                        <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed mb-2 sm:mb-4 md:mb-6">{product.description}</p>

                        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-4 md:mb-6">
                            {product.price.toLocaleString('fr-FR')} <span className="text-base sm:text-lg md:text-xl lg:text-2xl text-rose-500">FCFA</span>
                        </p>
                    </div>

                    {/* Boutons en bas à droite */}
                    {currentUser?.role !== 'admin' && (
                        <div className="flex flex-col gap-2 sm:gap-3">
                            {/* Bouton Favori */}
                            {currentUser && (
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`py-2 sm:py-3 px-4 sm:px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${
                                        isProductFavorite
                                            ? 'bg-amber-400 text-gray-900 hover:bg-amber-500'
                                            : 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-100'
                                    }`}
                                    title={isProductFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                >
                                    {isProductFavorite ? '❤️ Favoris' : '🤍 Favoris'}
                                </button>
                            )}

                            {/* Bouton Ajouter au panier */}
                            {isUnavailable ? (
                                <div className="flex-1 py-2 sm:py-3 px-4 sm:px-6 text-center rounded-lg bg-gray-200 text-gray-600 font-bold text-sm sm:text-base">
                                    Actuellement indisponible
                                </div>
                            ) : isOutOfStock ? (
                                <div className="flex-1 py-2 sm:py-3 px-4 sm:px-6 text-center rounded-lg bg-red-100 text-red-700 font-bold text-sm sm:text-base">
                                    En rupture de stock
                                </div>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart}
                                    className={`flex-1 py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-white transition-all duration-300 shadow-lg hover:shadow-xl ${
                                        isAdded || isInCart
                                            ? 'bg-green-500 hover:bg-green-600'
                                            : 'bg-rose-500 hover:bg-rose-600'
                                    } disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base`}
                                >
                                    {isAdded || isInCart ? '✓ Ajouté au panier !' : '🛒 Ajouter au panier'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Recommended Products - 2 par ligne */}
            {recommendedProducts.length > 0 && (
                <div className="mt-20 pt-10 border-t">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Vous pourriez aussi aimer</h2>
                    <div className="grid grid-cols-2 gap-6">
                         {recommendedProducts.map(recProduct => (
                            <div key={recProduct.id} onClick={() => navigateToProductPage(recProduct.id)} className="cursor-pointer">
                                 <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group">
                                    <div className="relative h-48 overflow-hidden flex items-center justify-center">
                                        <div className="absolute inset-0" style={{ backgroundImage: `url(${recProduct.imageUrls[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                                        <img src={recProduct.imageUrls[0]} alt={recProduct.name} className="relative z-10 w-full h-full object-contain" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-md font-semibold text-gray-800 truncate">{recProduct.name}</h3>
                                        <p className="text-lg font-bold text-rose-500 mt-2">{recProduct.price.toLocaleString('fr-FR')} FCFA</p>
                                    </div>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ProductDetailPage;