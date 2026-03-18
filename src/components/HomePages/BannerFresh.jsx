import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import WishlistButton from '../WishlistButton';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import SectionSkeleton from './SectionSkeleton';

function BannerFresh({ onQuickView }) {
  const { addToCart, isInCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddToCart, setLoadingAddToCart] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const autoScrollRef = useRef();
  const autoScrollPausedRef = useRef(false);
  const autoScrollTimeoutRef = useRef();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter for products with 10ml size
        const filtered = items.filter(product => {
          if (!Array.isArray(product.sizes)) return false;
          return product.sizes.some(sz => {
            const sizeLabel = typeof sz === 'object' ? sz.size : sz;
            const value = getNumericSizeValue(sizeLabel);
            return value !== null && value >= 2 && value <= 10;
          });
        });
        setProducts(filtered.slice(0, 10));
      } catch (error) {
        console.error('Error fetching products:', error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Slider Logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      pauseAutoScroll();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [loading, products]);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollRef.current = setInterval(() => {
      if (!autoScrollPausedRef.current && scrollRef.current) {
        const el = scrollRef.current;
        if (el.scrollLeft + el.offsetWidth >= el.scrollWidth - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: 340, behavior: 'smooth' });
        }
      }
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  };

  function pauseAutoScroll() {
    autoScrollPausedRef.current = true;
    clearTimeout(autoScrollTimeoutRef.current);
    autoScrollTimeoutRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, 2000);
  }

  // Helper Functions from Category.jsx style
  const getSelectedSize = (product) => {
    if (!product.sizes || !Array.isArray(product.sizes) || product.sizes.length === 0) return null;
    return product.sizes.find(sz => {
      const val = getNumericSizeValue(sz.size);
      return val !== null && val >= 2 && val <= 10;
    }) || product.sizes[0];
  };

  const getPrimaryImage = (product) => {
    const sz = getSelectedSize(product);
    return (sz && sz.images?.[0]) || product.image;
  };

  const getSelectedSizePrice = (product) => {
    const sz = getSelectedSize(product);
    return sz ? { price: sz.price, oldPrice: sz.oldPrice, size: sz.size, isPreOrder: !!sz.isPreOrder } : { price: null, oldPrice: null, size: null, isPreOrder: false };
  };

  const getNumericSizeValue = (label) => {
    if (!label) return null;
    const match = label.toString().match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  };

  const getAvailableSizes = (product) => {
    if (!Array.isArray(product.sizes)) return [];
    const uniqueMap = new Map();
    product.sizes.forEach(sz => {
      const label = sz && sz.size ? sz.size : (typeof sz === 'string' ? sz : null);
      if (!label) return;
      if (!uniqueMap.has(label)) {
        uniqueMap.set(label, getNumericSizeValue(label) ?? Infinity);
      }
    });
    return [...uniqueMap.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
  };

  const isOutOfStock = (product) => {
    const sz = getSelectedSize(product);
    if (sz?.isPreOrder) return false;
    if (product.isOutOfStock) return true;
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.every(sz => (sz.stock === 0 || sz.stock === '0' || sz.isOutOfStock));
    }
    return product.stock === 0 || product.stock === '0';
  };

  const formatPrice = (p) => {
    const n = typeof p === 'string' ? parseFloat(p) : p;
    return isNaN(n) ? '0.00' : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCategoryInfo = (badge) => {
    if (!badge) return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    const b = badge.toLowerCase();
    if (b === 'sale') return { icon: 'fa-percentage', bg: '#ef4444' };
    switch (b) {
      case 'new': return { icon: 'fa-star', bg: 'linear-gradient(135deg, #3FC53A, #4CAF50)' };
      case 'premium': return { icon: 'fa-crown', bg: 'linear-gradient(135deg, #C9B37E, #D4B04C)' };
      default: return { icon: 'fa-tag', bg: 'linear-gradient(135deg, #640d14, #9b7645)' };
    }
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    const sz = getSelectedSize(product);
    const sizeName = sz ? sz.size : (product.size || '');
    if (!sz?.isPreOrder && (isOutOfStock(product) || isInCart(product.id, sizeName))) return;

    setLoadingAddToCart(product.id);
    await new Promise(r => setTimeout(r, 600));
    addToCart({ ...product, selectedSize: sz || { size: sizeName, price: product.price, oldPrice: product.oldPrice } });
    setLoadingAddToCart(null);
    const offcanvas = document.getElementById('shoppingCart');
    if (offcanvas && window.bootstrap) {
      const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
      bsOffcanvas.show();
    }
  };

  if (loading) return <SectionSkeleton />;

  return (
    <section className="md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[10px] md:text-[12px] text-[#640d14] uppercase tracking-[0.4em] font-bold mb-3 block">Miniature Masterpieces</span>
            <h2 className="text-2xl md:text-4xl font-serif text-neutral-900 uppercase tracking-widest">Explore our miniatures</h2>
          </div>
          <button 
            onClick={() => navigate('/category')}
            className="hidden md:block text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-400 hover:text-black transition-colors"
          >
            Explore All Collection →
          </button>
        </div>

        <div 
          ref={scrollRef}
          onMouseEnter={() => autoScrollPausedRef.current = true}
          onMouseLeave={() => autoScrollPausedRef.current = false}
          className="flex gap-8 overflow-x-auto no-scrollbar pb-10 -mx-4 px-4 snap-x snap-mandatory"
        >
          {products.map((product) => {
            const sizeInfo = getSelectedSizePrice(product);
            const badgeInfo = getCategoryInfo(product.badge);
            const availableSizes = getAvailableSizes(product);
            
            return (
              <div 
                key={product.id} 
                className="group relative flex-shrink-0 w-[300px] md:w-[340px] bg-white rounded-[40px] p-6 border border-neutral-50 hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 hover:-translate-y-2 snap-start"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Badge */}
                {product.badge && (
                  <div 
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg" 
                    style={{ background: badgeInfo.bg, color: '#fff' }}
                  >
                    <i className={`fas ${badgeInfo.icon} text-[8px]`}></i>
                    <span className="text-[8px] uppercase tracking-widest font-bold">{product.badge}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-8 right-8 z-20 flex flex-col gap-3">
                  <WishlistButton 
                    product={product} 
                    className="!bg-white !shadow-lg !w-10 !h-10 !rounded-full !flex !items-center !justify-center !text-neutral-400 hover:!text-[#640d14] transition-all" 
                  />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.innerWidth < 768) return;
                      if (onQuickView) onQuickView(product);
                    }}
                    className="hidden md:flex w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg text-neutral-400 hover:text-[#640d14] transition-all"
                  >
                    <i className="fas fa-eye text-xs"></i>
                  </button>
                </div>

                {/* Image */}
                <div className="aspect-square mb-6 overflow-hidden rounded-3xl bg-[#fcfcfc]">
                  <img 
                    src={getPrimaryImage(product)} 
                    alt={product.name} 
                    className={`w-full h-full object-contain p-4 transition-all duration-700 group-hover:scale-110 ${isOutOfStock(product) ? 'grayscale opacity-50' : ''}`} 
                  />
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                  <p className="text-[8px] text-[#640d14] uppercase tracking-widest font-bold">{product.brand}</p>
                  <h3 className="text-sm font-serif text-neutral-900 line-clamp-1 h-5">{product.name}</h3>
                  
                  <div className="pt-3 space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm font-bold text-neutral-900">₹{formatPrice(sizeInfo.price)}</span>
                      {sizeInfo.oldPrice && (
                        <span className="text-[14px] text-neutral-400 line-through">₹{formatPrice(sizeInfo.oldPrice)}</span>
                      )}
                    </div>

                    {sizeInfo.size && (
                      <div className="text-[11px] text-neutral-500 uppercase tracking-widest font-medium">Size: {sizeInfo.size}</div>
                    )}

                    {availableSizes.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        {availableSizes.map(size => (
                          <span key={size} className="text-[8px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase tracking-tighter font-bold">
                            {size}
                          </span>
                        ))}
                      </div>
                    )}

                    {sizeInfo.isPreOrder ? (
                      <div className="w-full py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em] bg-amber-600/10 text-amber-700 text-center border border-amber-600/20">
                        Pre-Order
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={isOutOfStock(product) || loadingAddToCart === product.id || isInCart(product.id, getSelectedSize(product)?.size || product.size || '')}
                        className={`group relative w-full py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.25em]
                        flex items-center justify-center transition-all duration-300 overflow-hidden shadow-lg
                        ${isOutOfStock(product) || isInCart(product.id, getSelectedSize(product)?.size || product.size || '')
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none"
                            : "bg-neutral-900 text-white hover:bg-[#640d14] hover:shadow-xl active:scale-[0.97] shadow-neutral-200"
                          }`}
                      >
                        {loadingAddToCart === product.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <span className="text-center">
                            {isOutOfStock(product) ? "Out of Stock" : (isInCart(product.id, getSelectedSize(product)?.size || product.size || '') ? "Added to Cart" : "Add to Cart")}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile "Explore All" Button */}
        <div className="mt-8 flex justify-center md:hidden">
          <button 
            onClick={() => navigate('/category')}
            className="w-full max-w-[280px] py-4 bg-neutral-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Explore All Collection
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default BannerFresh;