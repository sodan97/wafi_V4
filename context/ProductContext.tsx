import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { db } from '../src/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import notificationService from '../src/services/notificationService';

interface ProductContextType {
  products: Product[];
  activeProducts: Product[];
  archivedProducts: Product[];
  isLoadingProducts: boolean;
  productError: { message: string; status?: number } | null;
  refreshProducts: () => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  updateProductStatus: (productId: string, status: 'active' | 'archived') => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  restoreProduct: (productId: string) => Promise<void>;
  permanentlyDeleteProduct: (productId: string) => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<{ message: string; status?: number } | null>(null);

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products]);
  const archivedProducts = useMemo(() => products.filter(p => p.status === 'archived'), [products]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductError(null);
    try {
      const productsCollection = collection(db, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const productsList: Product[] = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        const imageUrls = Array.isArray(data.imageUrls)
          ? data.imageUrls
          : typeof data.imageUrl === 'string'
            ? [data.imageUrl]
            : [];
        return {
          id: doc.id,
          ...data,
          imageUrls,
          price: typeof data.price === 'string' ? Number(data.price) : data.price ?? 0,
          stock: typeof data.stock === 'string' ? Number(data.stock) : data.stock ?? 0,
          status: data.status || 'active'
        } as Product;
      });
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (newProduct: Omit<Product, 'id'>) => {
    try {
      const productsCollection = collection(db, 'products');
      const docRef = await addDoc(productsCollection, {
        ...newProduct,
        createdAt: new Date().toISOString()
      });
      
      const newProductWithId: Product = {
        ...newProduct,
        id: docRef.id
      };
      
      setProducts(prev => [...prev, newProductWithId]);
      return newProductWithId;
    } catch (error) {
      console.error("Error adding product:", error);
      return null;
    }
  }, []);

  const updateProduct = useCallback(async (productId: string, productData: Partial<Product>) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: new Date().toISOString()
      });
      
      const updatedProductDoc = await getDoc(productRef);
      if (updatedProductDoc.exists()) {
        const updatedProduct: Product = {
          id: updatedProductDoc.id,
          ...updatedProductDoc.data()
        } as Product;
        
        setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        return updatedProduct;
      }
      return null;
    } catch (error) {
      console.error("Error updating product:", error);
      return null;
    }
  }, []);

  const updateProductStock = useCallback(async (productId: string, newStock: number) => {
    try {
      // Récupérer l'ancien stock avant la mise à jour
      const currentProduct = products.find(p => p.id === productId);
      const oldStock = currentProduct?.stock ?? 0;
      const productName = currentProduct?.name ?? 'Produit';
      const productImage = currentProduct?.images?.[0];

      // Mettre à jour le stock dans Firestore
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        stock: newStock,
        updatedAt: new Date().toISOString()
      });

      // Mettre à jour l'état local
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      ));

      // Envoyer les notifications si le stock passe de 0 à > 0
      if (oldStock === 0 && newStock > 0) {
        console.log(`📧 Triggering notifications for product "${productName}" (stock: ${oldStock} → ${newStock})`);
        notificationService.notifyStockAvailable(productId, productName, oldStock, newStock, productImage)
          .then(result => {
            console.log('✅ Notification result:', result);
          })
          .catch(error => {
            console.error('❌ Error sending notifications:', error);
          });
      }
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw error;
    }
  }, [products]);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        status: 'deleted',
        deletedAt: new Date().toISOString()
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: 'deleted' } : p
      ));
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }, []);

  const updateProductStatus = useCallback(async (productId: string, status: 'active' | 'archived') => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status } : p
      ));
    } catch (error) {
      console.error("Error updating product status:", error);
      throw error;
    }
  }, []);

  const restoreProduct = useCallback(async (productId: string) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        status: 'active',
        restoredAt: new Date().toISOString()
      });
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, status: 'active' } : p
      ));
    } catch (error) {
      console.error("Error restoring product:", error);
      throw error;
    }
  }, []);

  const permanentlyDeleteProduct = useCallback(async (productId: string) => {
    try {
      const productRef = doc(db, 'products', productId);
      await deleteDoc(productRef);
      
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Error permanently deleting product:", error);
      throw error;
    }
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        activeProducts,
        archivedProducts,
        isLoadingProducts,
        productError,
        refreshProducts,
        updateProductStock,
        updateProductStatus,
        deleteProduct,
        restoreProduct,
        permanentlyDeleteProduct,
        addProduct,
        updateProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
