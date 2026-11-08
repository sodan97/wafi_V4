import React, { useState, useMemo, useEffect } from 'react';
import { useProduct } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { formatPrice } from './ProductCard';
import { ArrowLeftIcon, CartIcon, CheckIcon, HeartIcon, MinusIcon, PlusIcon, PlayIcon, ImageIcon, TruckIcon, ChatIcon, ShieldIcon } from './icons';

interface ProductDetailPageProps {
    productId: string;
    onBack: () => void;
    navigateToProductPage: (id: string) => void;
}

const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onBack, navigateToProductPage }) => {
    const { products, activeProducts } = useProduct();
    const { addToCart, cartItems } = useCart();
    const { currentUser } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [isAdded, setIsAdded] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
    const [selectedImage, setSelectedImage] = useState(product?.imageUrls[0] || '');
    const cartItem = cartItems.find(item => item.id === productId);

    useEffect(() => {
        setIsAdded(false);
        setQuantity(1);
    }, [productId]);

    useEffect(() => {
        if (product) {
            setSelectedImage(product.imageUrls[0]);
            setShowVideo(false);
            window.scrollTo(0, 0);
        }
    }, [product]);

    if (!product || product.status === 'deleted') {
        return (
            <div className="rounded-3xl bg-white py-20 text-center ring-1 ring-ink-900/5">
                <p className="font-display text-2xl font-semibold text-ink-900">Ce jouet n’existe plus</p>
                <button onClick={onBack} className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">Retour à la boutique</button>
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'admin';
    const isUnavailable = product.status === 'archived';
    const isOutOfStock = product.stock <= 0;
    const canAddToCart = !isOutOfStock && !isUnavailable;
    const isProductFavorite = isFavorite(product.id);
    const maxQuantity = Math.max(1, product.stock - (cartItem?.quantity || 0));
    const youtubeUrl = product.videoUrl ? getYoutubeEmbedUrl(product.videoUrl) : null;

    const handleAddToCart = () => {
        if (!canAddToCart) return;
        addToCart(product, Math.min(quantity, maxQuantity));
        setIsAdded(true);
    };

    const recommendedProducts = activeProducts
        .filter(p => p.id !== product.id && p.stock > 0)
        .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
        .slice(0, 4);

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 rounded-full px-1 py-1 text-sm font-semibold text-ink-700 hover:text-brand-700">
                <ArrowLeftIcon className="h-5 w-5" />
                Retour à la boutique
            </button>

            <div className="grid gap-6 rounded-[2rem] bg-white p-4 ring-1 ring-ink-900/5 sm:p-8 lg:grid-cols-2 lg:gap-12">
                {/* Galerie */}
                <div>
                    <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream">
                        {showVideo && product.videoUrl ? (
                            youtubeUrl ? (
                                <iframe
                                    src={youtubeUrl}
                                    className="h-full w-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={`Vidéo ${product.name}`}
                                />
                            ) : (
                                <video src={product.videoUrl} className="h-full w-full" controls title={`Vidéo ${product.name}`} />
                            )
                        ) : (
                            <img src={selectedImage} alt={product.name} className="h-full w-full object-contain p-6 mix-blend-multiply" />
                        )}
                        {(isUnavailable || isOutOfStock) && !showVideo && (
                            <span className="absolute left-4 top-4 rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-white">
                                {isUnavailable ? 'Indisponible' : 'Épuisé'}
                            </span>
                        )}
                    </div>

                    {(product.imageUrls.length > 1 || product.videoUrl) && (
                        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                            {product.imageUrls.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => { setSelectedImage(img); setShowVideo(false); }}
                                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream p-1 ring-2 transition sm:h-20 sm:w-20 ${!showVideo && selectedImage === img ? 'ring-brand-500' : 'ring-transparent hover:ring-ink-900/10'}`}
                                    aria-label={`Photo ${index + 1}`}
                                >
                                    <img src={img} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                                </button>
                            ))}
                            {product.videoUrl && (
                                <button
                                    onClick={() => setShowVideo(true)}
                                    className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-ink-900 text-[11px] font-semibold text-white ring-2 transition sm:h-20 sm:w-20 ${showVideo ? 'ring-brand-500' : 'ring-transparent'}`}
                                >
                                    {showVideo ? <ImageIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                                    Vidéo
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Informations */}
                <div className="flex flex-col">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{product.category}</p>
                    <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink-900 first-letter:uppercase sm:text-4xl">{product.name}</h1>
                    <p className="mt-4 font-display text-3xl font-semibold text-brand-700">{formatPrice(product.price)}</p>

                    <p className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${isOutOfStock || isUnavailable ? 'text-ink-500' : product.stock <= 2 ? 'text-tangerine-600' : 'text-brand-700'}`}>
                        <span className={`h-2 w-2 rounded-full ${isOutOfStock || isUnavailable ? 'bg-ink-500' : product.stock <= 2 ? 'bg-tangerine-500' : 'bg-brand-500'}`} />
                        {isUnavailable ? 'Actuellement indisponible' : isOutOfStock ? 'Épuisé pour le moment' : product.stock <= 2 ? `Plus que ${product.stock} en stock` : 'En stock'}
                    </p>

                    <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-700">{product.description}</p>

                    {!isAdmin && (
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            {canAddToCart ? (
                                <>
                                    <div className="flex items-center justify-between rounded-full bg-cream p-1 sm:w-36" aria-label="Quantité">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 hover:bg-white" aria-label="Diminuer la quantité">
                                            <MinusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center font-semibold">{quantity}</span>
                                        <button onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))} className="flex h-11 w-11 items-center justify-center rounded-full text-ink-700 hover:bg-white disabled:opacity-30" disabled={quantity >= maxQuantity} aria-label="Augmenter la quantité">
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleAddToCart}
                                        className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-white shadow-md shadow-brand-600/20 transition ${isAdded ? 'bg-brand-700' : 'bg-brand-600 hover:bg-brand-700'}`}
                                    >
                                        {isAdded ? <CheckIcon className="h-5 w-5" /> : <CartIcon className="h-5 w-5" />}
                                        {isAdded ? 'Ajouté au panier' : 'Ajouter au panier'}
                                    </button>
                                </>
                            ) : (
                                <p className="flex-1 rounded-full bg-cream px-6 py-3.5 text-center font-semibold text-ink-500">
                                    {isUnavailable ? 'Actuellement indisponible' : 'Bientôt de retour'}
                                </p>
                            )}
                            {currentUser && (
                                <button
                                    onClick={() => toggleFavorite(product.id)}
                                    className={`flex h-[52px] items-center justify-center gap-2 rounded-full px-5 font-semibold ring-1 transition sm:w-[52px] sm:px-0 ${isProductFavorite ? 'bg-tangerine-100 text-tangerine-600 ring-tangerine-100' : 'text-ink-700 ring-ink-900/10 hover:ring-tangerine-400'}`}
                                    aria-label={isProductFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                    aria-pressed={isProductFavorite}
                                >
                                    <HeartIcon filled={isProductFavorite} className="h-5 w-5" />
                                    <span className="sm:hidden">Favoris</span>
                                </button>
                            )}
                        </div>
                    )}

                    <ul className="mt-8 grid gap-3 border-t border-ink-900/5 pt-6 text-sm text-ink-700">
                        <li className="flex items-center gap-3"><TruckIcon className="h-5 w-5 text-brand-600" />Livraison partout à Dakar ; en région, écrivez-nous pour vérifier</li>
                        <li className="flex items-center gap-3"><ChatIcon className="h-5 w-5 text-brand-600" />Commande et paiement confirmés avec vous sur WhatsApp</li>
                        <li className="flex items-center gap-3"><ShieldIcon className="h-5 w-5 text-brand-600" />Conseil personnalisé selon l’âge de l’enfant</li>
                    </ul>
                </div>
            </div>

            {recommendedProducts.length > 0 && (
                <section className="mt-14">
                    <h2 className="text-2xl font-semibold text-ink-900 sm:text-3xl">Ils pourraient aussi lui plaire</h2>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
                        {recommendedProducts.map(rec => (
                            <button
                                key={rec.id}
                                onClick={() => navigateToProductPage(rec.id)}
                                className="group overflow-hidden rounded-3xl bg-white text-left ring-1 ring-ink-900/5 transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="aspect-square p-4">
                                    <img src={rec.imageUrls[0]} alt="" loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                                </div>
                                <div className="border-t border-ink-900/5 p-3 sm:p-4">
                                    <p className="truncate text-sm font-semibold text-ink-900 first-letter:uppercase">{rec.name}</p>
                                    <p className="mt-1 font-display text-lg font-semibold text-ink-900">{formatPrice(rec.price)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetailPage;
