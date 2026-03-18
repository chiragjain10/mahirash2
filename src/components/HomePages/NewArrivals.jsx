import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../context/CartContext';
import WishlistButton from '../WishlistButton';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import SectionSkeleton from './SectionSkeleton';

function NewArrivals({ onQuickView }) {
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
        // Filter for products with 'New Arrivals' tag
        const filtered = items.filter(product => Array.isArray(product.tags) && product.tags.includes('New Arrivals'));
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
  const get50mlSize = (product) => {
    if (!Array.isArray(product.sizes)) return null;
    return product.sizes.find(sz => (typeof sz === 'object' && sz.size === '50ml')) || null;
  };
  
  const getHighestSize = (product) => {
    if (!Array.isArray(product.sizes) || product.sizes.length === 0) return null;
    const validSizes = product.sizes.filter(sz => sz.size && sz.price);
    if (validSizes.length === 0) return null;
    const sortedSizes = validSizes.sort((a, b) => {
      const aMatch = a.size.toString().match(/(\d+(?:\.\d+)?)/);
      const bMatch = b.size.toString().match(/(\d+(?:\.\d+)?)/);
      if (!aMatch || !bMatch) return 0;
      return parseFloat(bMatch[1]) - parseFloat(aMatch[1]);
    });
    return sortedSizes[0];
  };

  const getSelectedSize = (product) => {
    return get50mlSize(product) || getHighestSize(product) || (product.sizes?.[0]) || null;
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
    <section className="section-padding bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <span>Premium Collection</span>
          <h2>New Arrivals</h2>
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
                className="group relative flex-shrink-0 w-[260px] md:w-[320px] bg-white transition-all duration-500 snap-start"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f5f5]">
                  <img 
                    src={getPrimaryImage(product)} 
                    alt={product.name} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock(product) ? 'grayscale opacity-50' : ''}`} 
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
                        if (onQuickView) onQuickView(product);
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
                          <span className="text-[11px] text-[#999] uppercase tracking-wider">Regular price</span>
                          <span className="text-[13px] text-[#999] line-through">₹{formatPrice(sizeInfo.oldPrice)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#454545] uppercase tracking-wider">Sale price</span>
                          <span className="text-[14px] font-semibold text-[#454545]">From ₹{formatPrice(sizeInfo.price)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#454545] uppercase tracking-wider">Regular price</span>
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

export default NewArrivals;