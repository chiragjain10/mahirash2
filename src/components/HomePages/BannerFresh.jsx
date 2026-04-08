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
        // Filter for products with 2ml-10ml size
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

  // Helper Functions
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

  if (loading) return <SectionSkeleton />;

  return (
    <section className="section-padding bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="section-title">
          <span>Miniature Masterpieces</span>
          <h2>Explore our miniatures</h2>
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => navigate('/category')}
              className="bg-[#640d14] text-white px-8 py-2.5 text-[14px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-all duration-300"
            >
              VIEW ALL
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          onMouseEnter={() => autoScrollPausedRef.current = true}
          onMouseLeave={() => autoScrollPausedRef.current = false}
          className="flex gap-8 overflow-x-auto no-scrollbar pb-10 -mx-4 px-4 snap-x snap-mandatory"
        >
          {products.map((product) => {
            const sizeInfo = getSelectedSizePrice(product);
            
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

                  {/* Quick View Button */}
                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full lg:group-hover:translate-y-0 transition-transform duration-300 z-20">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onQuickView) onQuickView(product);
                      }}
                      className="w-full bg-[#640d14] text-white py-2 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors flex items-center justify-center"
                    >
                      Quick View
                    </button>
                  </div>
                  
                  {/* Mobile Quick View Overlay */}
                  <div 
                    className="lg:hidden absolute inset-0 z-10 bg-black/5 opacity-0 active:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onQuickView) onQuickView(product);
                    }}
                  />

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
                  
                  {sizeInfo.size && <div className="mt-1 text-[11px] uppercase tracking-widest text-neutral-400">{sizeInfo.size}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BannerFresh;