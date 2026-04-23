import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useProduct } from '../context/ProductContext';
import { Product } from '../types';

interface AllProductsViewProps {
  onProductSelect: (id: string) => void;
  onNotifyMeClick: (product: Product) => void;
}

const AllProductsView: React.FC<AllProductsViewProps> = ({ onProductSelect, onNotifyMeClick }) => {
  const { activeProducts } = useProduct();
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;

  const filteredProducts = useMemo(() => {
    let filtered = activeProducts;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (minPrice) {
      filtered = filtered.filter(product => product.price >= parseFloat(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter(product => product.price <= parseFloat(maxPrice));
    }

    if (sortOrder !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      });
    }

    return filtered;
  }, [activeProducts, searchTerm, minPrice, maxPrice, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('none');
  };

  const filtersPanel = (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">🔍 Filtres</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rechercher
        </label>
        <input
          type="text"
          placeholder="Nom ou description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 Prix min (FCFA)
        </label>
        <input
          type="number"
          placeholder="0"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💰 Prix max (FCFA)
        </label>
        <input
          type="number"
          placeholder="999999"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📊 Trier par prix
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc' | 'none')}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        >
          <option value="none">Sans tri</option>
          <option value="asc">Prix croissant</option>
          <option value="desc">Prix décroissant</option>
        </select>
      </div>

      <div className="mb-4 pt-2 border-t">
        <p className="text-xs text-gray-600 mb-2">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={handleResetFilters}
          className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ marginBottom: '64px' }}>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 border-l-4 border-rose-500 pl-4">
          Nos Produits
        </h2>
        <p className="text-md text-gray-500 mb-4 pl-5">
          Découvrez notre sélection exclusive de produits de qualité.
        </p>

        {!isDesktop && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              🔍 {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              <span style={{ marginLeft: '4px' }}>{showFilters ? '▲' : '▼'}</span>
            </button>
            {showFilters && <div style={{ marginTop: '12px' }}>{filtersPanel}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {isDesktop && (
            <aside style={{ width: '256px', flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: '96px' }}>
                {filtersPanel}
              </div>
            </aside>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
              gap: '24px',
            }}>
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
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucun produit ne correspond à vos critères de recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProductsView;
