import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useProduct } from '../context/ProductContext';
import { Product } from '../types';
import { SearchIcon, CloseIcon } from './icons';

interface AllProductsViewProps {
  onProductSelect: (id: string) => void;
  onNotifyMeClick: (product: Product) => void;
}

type SortOrder = 'none' | 'asc' | 'desc';

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix', min: 0, max: Infinity },
  { id: 'lt10', label: 'Moins de 10 000 F', min: 0, max: 9999 },
  { id: '10to20', label: '10 000 à 20 000 F', min: 10000, max: 20000 },
  { id: 'gt20', label: 'Plus de 20 000 F', min: 20001, max: Infinity },
];

const AllProductsView: React.FC<AllProductsViewProps> = ({ onProductSelect, onNotifyMeClick }) => {
  const { activeProducts } = useProduct();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    activeProducts.forEach(p => p.category && counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const range = PRICE_RANGES.find(r => r.id === priceRange)!;

    let filtered = activeProducts.filter(product =>
      (category === 'all' || product.category === category) &&
      product.price >= range.min && product.price <= range.max &&
      (!term || product.name.toLowerCase().includes(term) || product.description.toLowerCase().includes(term))
    );

    if (sortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => (sortOrder === 'asc' ? a.price - b.price : b.price - a.price));
    } else {
      // Produits disponibles d'abord
      filtered = [...filtered].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
    }
    return filtered;
  }, [activeProducts, searchTerm, category, priceRange, sortOrder]);

  const hasFilters = searchTerm || category !== 'all' || priceRange !== 'all' || sortOrder !== 'none';

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setPriceRange('all');
    setSortOrder('none');
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-900/10 hover:ring-brand-400'}`;

  return (
    <section id="catalogue" className="mt-14 scroll-mt-28" aria-labelledby="catalogue-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="catalogue-title" className="text-3xl font-semibold text-ink-900 sm:text-4xl">Nos jouets</h2>
          <p className="mt-1 text-ink-500">Des jeux qui font travailler les mains et la tête.</p>
        </div>
        <p className="text-sm text-ink-500" aria-live="polite">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Catégories */}
      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Catégories">
        <button role="tab" aria-selected={category === 'all'} onClick={() => setCategory('all')} className={chip(category === 'all')}>
          Tout voir
        </button>
        {categories.map(([name, count]) => (
          <button key={name} role="tab" aria-selected={category === name} onClick={() => setCategory(name)} className={chip(category === name)}>
            {name} <span className="ml-1 opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Barre de recherche et tri */}
      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-900/5 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Rechercher un jouet</span>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            placeholder="Rechercher : robot, éolienne, voiture…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-0 bg-cream py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-500/70 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </label>
        <label className="block">
          <span className="sr-only">Budget</span>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full rounded-xl border-0 bg-cream px-4 py-3 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-400">
            {PRICE_RANGES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Trier</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)} className="w-full rounded-xl border-0 bg-cream px-4 py-3 text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="none">Recommandés</option>
            <option value="asc">Prix croissant</option>
            <option value="desc">Prix décroissant</option>
          </select>
        </label>
      </div>

      {hasFilters && (
        <button onClick={handleResetFilters} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          <CloseIcon className="h-4 w-4" />Effacer les filtres
        </button>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onProductSelect={onProductSelect}
            onNotifyMeClick={onNotifyMeClick}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="mt-6 rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-ink-900/5">
          <p className="font-display text-xl font-semibold text-ink-900">Aucun jouet ne correspond</p>
          <p className="mt-2 text-ink-500">Essayez un autre mot ou un autre budget.</p>
          <button onClick={handleResetFilters} className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
            Voir tous les jouets
          </button>
        </div>
      )}
    </section>
  );
};

export default AllProductsView;
