import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../components/firebase';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import QuickView from '../components/QuickView';
import WishlistButton from '../components/WishlistButton';
import './newarrivals.css';

function NewArrivalsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGender, setSelectedGender] = useState('all');
  const [loadingProducts, setLoadingProducts] = useState({});
  
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all products from Firebase and filter by tags
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      const allProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for products with "New Arrivals" tag (matching existing logic)
      const newArrivalsProducts = allProducts.filter(product => 
        Array.isArray(product.tags) && product.tags.includes('New Arrivals')
      );
      
      setProducts(newArrivalsProducts);
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
      setError('Failed to load new arrivals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const handleAddToCart = async (product) => {
    setLoadingProducts(prev => ({ ...prev, [product.id]: true }));
    
    await new Promise(res => setTimeout(res, 600));
    
    // Get 50ml size since this section displays 50ml prices
    const size50ml = get50mlSize(product);
    const productWithSize = {
      ...product,
      selectedSize: size50ml || { size: '', price: product.price, oldPrice: product.oldPrice }
    };
    
    addToCart(productWithSize);
    
    setLoadingProducts(prev => ({ ...prev, [product.id]: false }));
    
    const offcanvas = document.getElementById('shoppingCart');
    if (offcanvas) {
      const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
      bsOffcanvas.show();
    }
  };

  const handleCardClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleQuickView = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseQuickView = () => {
    setSelectedProduct(null);
  };

  const filteredProducts = (selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory))
    .filter(product => {
      if (selectedGender === 'all') return true;
      const gender = (product.gender || 'unisex').toLowerCase();
      if (selectedGender === 'men') return gender === 'men' || gender === 'unisex';
      if (selectedGender === 'women') return gender === 'women' || gender === 'unisex';
      // if (selectedGender === 'unisex') return gender === 'unisex';
      return true;
    });

  const categories = ['all', 'men', 'women', 'unisex'];
  const genders = ['all', 'men', 'women', 'unisex'];

  // Helpers for 50ml display and cart
  function get50mlSize(product) {
    if (!Array.isArray(product.sizes)) return null;
    return product.sizes.find(sz => (typeof sz === 'object' && sz.size === '50ml')) || null;
  }
  function getProductPrimaryImage(product) {
    const s50 = get50mlSize(product);
    if (s50 && Array.isArray(s50.images) && s50.images[0]) return s50.images[0];
    const firstSizeImg = Array.isArray(product.sizes) && product.sizes[0] && Array.isArray(product.sizes[0].images) ? product.sizes[0].images[0] : null;
    return firstSizeImg || product.image;
  }
  // Keep 20ml helper for add-to-cart behaviour consistency
  function get20mlSize(product) {
    if (!Array.isArray(product.sizes)) return null;
    return product.sizes.find(sz => (typeof sz === 'object' && sz.size === '20ml')) || null;
  }

  function getNumericSizeValue(label) {
    if (!label) return null;
    const match = label.toString().match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  function getAvailableSizes(product) {
    if (!Array.isArray(product.sizes)) return [];
    const unique = new Map();
    product.sizes.forEach(sz => {
      const label = sz && typeof sz === 'object' ? sz.size : sz;
      if (!label) return;
      if (!unique.has(label)) {
        unique.set(label, getNumericSizeValue(label) ?? Infinity);
      }
    });
    return [...unique.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
  }

  function formatPrice(price) {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  if (loading) {
    return (
      <div className="na-container">
        <div className="na-loading">
          <div className="na-spinner"></div>
          <p>Loading new arrivals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="na-container">
        <div className="na-error">
          <div className="na-error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchNewArrivals} className="na-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="na-container bg-white min-h-screen">
      {/* Hero Section */}
      <div className="pt-24 pb-12 text-center px-4 border-b border-neutral-100">
        <span className="text-[14px] text-[#999] uppercase tracking-[0.3em] font-medium mb-3 block">Premium Selection</span>
        <h1 className="text-4xl md:text-5xl font-light text-[#454545] uppercase tracking-[0.2em] mb-8">New Arrivals</h1>
      </div>

      {/* Category Filter */}
      <div className="na-filter-section py-8 px-4">
        <div className="flex flex-wrap justify-center gap-4">
          {genders.map(g => (
            <button
              key={g}
              className={`px-6 py-2 text-[14px] uppercase tracking-[0.2em] transition-all duration-300 ${selectedGender === g ? 'bg-[#454545] text-white' : 'bg-transparent text-[#454545] border border-neutral-200 hover:border-[#454545]'}`}
              onClick={() => setSelectedGender(g)}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="na-products-section px-4 py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-100">
            <i className="fas fa-search text-neutral-200 text-3xl mb-4"></i>
            <p className="text-[14px] uppercase tracking-widest text-neutral-400">No new arrivals found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredProducts.map(product => {
              const sizeInfo = get50mlSize(product) || product.sizes?.[0] || { price: product.price, oldPrice: product.oldPrice };
              return (
                <div 
                  key={product.id} 
                  className="group relative flex flex-col bg-white transition-all duration-500"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                    <img 
                      src={getProductPrimaryImage(product)} 
                      alt={product.name} 
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${product.isOutOfStock ? 'grayscale opacity-50' : ''}`} 
                    />
                    
                    {/* Minimalist Badge */}
                    {product.badge && (
                      <div className="absolute top-4 left-4 z-10 bg-[#454545] text-white px-3 py-1 text-[9px] uppercase tracking-widest font-medium">
                        {product.badge}
                      </div>
                    )}

                    {/* Quick View Button (Task 6) */}
                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickView(product);
                        }}
                        className="w-full bg-[#640d14] text-white py-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors"
                      >
                        Quick View
                      </button>
                    </div>

                    {/* Wishlist Action */}
                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <WishlistButton 
                        product={product} 
                        className="!bg-white !w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-[#454545] hover:!bg-[#454545] hover:!text-white transition-all shadow-sm" 
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-5 text-center">
                    <h3 className="text-[14px] font-medium text-[#454545] uppercase tracking-[0.15em] mb-2 px-2 line-clamp-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex flex-col items-center gap-1">
                      {sizeInfo.oldPrice ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] text-[#999] uppercase tracking-wider">Regular price</span>
                            <span className="text-[13px] text-[#999] line-through">₹{formatPrice(sizeInfo.oldPrice)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] text-[#454545] uppercase tracking-wider">Sale price</span>
                            <span className="text-[14px] font-semibold text-[#454545]">From ₹{formatPrice(sizeInfo.price)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-[#454545] uppercase tracking-wider">Regular price</span>
                          <span className="text-[14px] font-semibold text-[#454545]">From ₹{formatPrice(sizeInfo.price)}</span>
                        </div>
                      )}
                    </div>

                    {/* Minimalist Sale Tag */}
                    {sizeInfo.oldPrice && (
                      <div className="mt-2 inline-block border border-[#454545] px-2 py-0.5 text-[9px] text-[#454545] uppercase tracking-widest font-medium">
                        Sale
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickView
          product={selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  );
}

export default NewArrivalsPage; 