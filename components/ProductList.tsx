
import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useProduct } from '../context/ProductContext';
import { Product } from '../types';

interface ProductListProps {
  category: string;
  onProductSelect: (id: number) => void;
  onNotifyMeClick: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ category, onProductSelect, onNotifyMeClick }) => {
  const { activeProducts: allProducts } = useProduct();
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(p => p.category === category);

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
  }, [allProducts, category, searchTerm, minPrice, maxPrice, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('none');
  };

  return (
    <div className="mt-2">
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 border-l-4 border-rose-500 pl-4">{category}</h2>
        <p className="text-md text-gray-500 mb-6 pl-5">Découvrez tous les produits de la catégorie {category}.</p>

        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
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
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
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

export default ProductList;