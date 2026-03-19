import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePreloader } from '../context/PreloaderContext';
import WishlistButton from './WishlistButton';
import { MdShoppingCart, MdFlashOn, MdAdd, MdRemove } from 'react-icons/md';
import ProductSkeleton from './ProductSkeleton';

// Premium Icons Component
const PremiumIcons = {
  Star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
  Truck: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM19.5 9.5H17V12h4.46L19.5 9.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.11.89-2 2-2h14v4h3z" />
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  ),
  Package: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z" />
    </svg>
  )
};

function ProductDetails() {
  // Context hooks
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showPreloader, hidePreloader } = usePreloader();

  // State hooks
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [accordionOpen, setAccordionOpen] = useState('description');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showSticky, setShowSticky] = useState(false);

  // Scroll observer for sticky bottom bar
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when user scrolls past the main buy buttons
      const mainButtons = document.getElementById('main-buy-buttons');
      if (mainButtons) {
        const rect = mainButtons.getBoundingClientRect();
        setShowSticky(rect.top < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoized callbacks
  const handleQuantityChange = useCallback((delta, stock) => {
    setQuantity((prev) => {
      const stockVal = stock !== undefined && stock !== null ? Number(stock) : Infinity;
      return Math.min(stockVal, Math.max(1, prev + delta));
    });
  }, []);

  const getProductPrimaryImage = useCallback((p) => {
    if (!p) return '';
    if (Array.isArray(p.sizes)) {
      const size50 = p.sizes.find(sz => sz && typeof sz === 'object' && sz.size === '50ml');
      if (size50 && Array.isArray(size50.images) && size50.images[0]) return size50.images[0];
      for (const sz of p.sizes) {
        if (sz && Array.isArray(sz.images) && sz.images[0]) return sz.images[0];
      }
    }
    return p.image || p.hoverImage || p.image3 || p.image4 || '';
  }, []);

  const formatPrice = useCallback((price) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Memoized values
  const sizesArr = useMemo(() => {
    if (!product) return [];

    const p = product;
    const baseSizes = Array.isArray(p.sizes) && p.sizes.length > 0
      ? p.sizes
      : [{
        size: p.size || 'Standard',
        price: p.price || 0,
        oldPrice: p.oldPrice || '',
        images: [p.image, p.hoverImage, p.image3, p.image4].filter(Boolean),
        stock: p.stock,
        isOutOfStock: !!p.isOutOfStock
      }];

    return baseSizes.map(sz => {
      // Logic: Out of stock if stock field exists and is <= 0
      // If stock is undefined or null, we assume it's in stock (backwards compatibility)
      const stockVal = sz.stock !== undefined && sz.stock !== null ? Number(sz.stock) : null;
      const isOOS = (stockVal !== null && stockVal <= 0) || sz.isOutOfStock === true;

      return {
        ...sz,
        isOutOfStock: !!isOOS
      };
    });
  }, [product]);

  const finalDefaultIdx = useMemo(() => {
    if (sizesArr.length === 0) return 0;
    if (location.state?.fromBannerFresh) {
      const defaultIdx = sizesArr.findIndex(s => (s && s.size) === '10ml');
      const fallbackIdx = sizesArr.findIndex(s => (s && s.size) === '50ml');
      return defaultIdx >= 0 ? defaultIdx : (fallbackIdx >= 0 ? fallbackIdx : 0);
    } else {
      if (location.state?.preferredSize) {
        const preferredIdx = sizesArr.findIndex(s => (s && s.size) === location.state.preferredSize);
        if (preferredIdx >= 0) return preferredIdx;
      }

      const defaultIdx = sizesArr.findIndex(s => (s && s.size) === '50ml');
      if (defaultIdx >= 0) return defaultIdx;

      let highestIdx = 0;
      let highestValue = -1;
      sizesArr.forEach((sz, idx) => {
        if (sz && sz.size) {
          const match = sz.size.toString().match(/(\d+(?:\.\d+)?)/);
          const value = match ? parseFloat(match[1]) : null;
          if (value !== null && value > highestValue) {
            highestValue = value;
            highestIdx = idx;
          }
        }
      });
      return highestIdx;
    }
  }, [sizesArr, location.state?.fromBannerFresh, location.state?.preferredSize]);

  const preferredSizeIndex = useMemo(() => {
    if (sizesArr.length === 0) return 0;
    const preferredIdx = finalDefaultIdx ?? 0;
    if (sizesArr[preferredIdx] && !sizesArr[preferredIdx].isOutOfStock) {
      return preferredIdx;
    }
    const firstAvailable = sizesArr.findIndex(sz => !sz.isOutOfStock);
    return firstAvailable !== -1 ? firstAvailable : preferredIdx;
  }, [sizesArr, finalDefaultIdx]);

  const productImages = useMemo(() => {
    if (sizesArr.length === 0) return [];
    const selected = sizesArr[selectedSizeIdx] || sizesArr[preferredSizeIndex] || sizesArr[0];
    return Array.isArray(selected?.images) && selected.images.length > 0
      ? selected.images
      : (product
        ? [product.image,
        (product.hoverImage && product.hoverImage !== product.image) ? product.hoverImage : null,
        product.image3,
        product.image4
        ].filter(Boolean)
        : []);
  }, [sizesArr, selectedSizeIdx, preferredSizeIndex, product]);

  const selectedSize = sizesArr[selectedSizeIdx] || sizesArr[preferredSizeIndex] || sizesArr[0] || {};
  const isPreOrder = !!selectedSize?.isPreOrder;
  const isSelectedSizeOut = !isPreOrder && !!selectedSize?.isOutOfStock;
  const isAlreadyInCart = useMemo(() => {
    if (!product || !selectedSize) return false;
    return isInCart(product.id, selectedSize.size);
  }, [product?.id, selectedSize?.size, isInCart]);

  const getWhatsAppNotifyUrl = useCallback(() => {
    const phoneNumber = '919584826112';
    const productName = product?.name || 'product';
    const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
    const message = `Hi! I'm interested in "${productName}${sizeLabel}". Please notify me when it's back in stock.`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  }, [product?.name, selectedSize?.size]);

  const handlePreOrderWhatsApp = useCallback(() => {
    const phoneNumber = '919584826112';
    const productName = product?.name || 'product';
    const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
    const message = `Hi! I'm interested in Pre-ordering the "${productName}${sizeLabel}". Please let me know how to proceed.`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }, [product?.name, selectedSize?.size]);

  const handleAddToCart = useCallback(async () => {
    if (isPreOrder) {
      handlePreOrderWhatsApp();
      return;
    }
    if (isSelectedSizeOut || isAlreadyInCart) return;
    setButtonLoading(true);
    await new Promise(res => setTimeout(res, 600));
    addToCart({ ...product, quantity, selectedSize });
    showToast('Product added to cart', 'success');
    setButtonLoading(false);
    const offcanvas = document.getElementById('shoppingCart');
    const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
    bsOffcanvas.show();
  }, [isSelectedSizeOut, isAlreadyInCart, addToCart, product, quantity, selectedSize, showToast, isPreOrder, handlePreOrderWhatsApp]);

  const handleBuyNow = useCallback(async () => {
    if (isPreOrder) {
      handlePreOrderWhatsApp();
      return;
    }
    if (isSelectedSizeOut) return;

    if (!user) {
      showToast('Please login to continue', 'info');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    setBuyNowLoading(true);
    // Navigate to checkout with only this product in state
    // We don't add it to the global cart to keep "Buy Now" independent
    navigate('/checkout', {
      state: {
        buyNowItem: {
          ...product,
          quantity,
          selectedSize,
          cartItemId: `buynow-${Date.now()}`
        }
      }
    });
    setBuyNowLoading(false);
  }, [isPreOrder, isSelectedSizeOut, user, navigate, location.pathname, product, quantity, selectedSize, handlePreOrderWhatsApp, showToast]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setRelatedLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.id !== id)
          .slice(0, 8);
        setRelatedProducts(productsList);
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
      setRelatedLoading(false);
    };
    fetchRelatedProducts();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const q = query(
          collection(db, 'reviews'),
          where('productId', '==', id)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Handle sorting natively due to missing indexes usually
        data.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
      setReviewsLoading(false);
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    setSelectedSizeIdx(preferredSizeIndex);
  }, [preferredSizeIndex]);

  useEffect(() => {
    setSelectedImage(productImages[0] || '');
  }, [productImages]);

  useEffect(() => {
    if (selectedSize?.stock != null) {
      const stockVal = Number(selectedSize.stock);
      if (quantity > stockVal) {
        setQuantity(Math.max(1, stockVal));
      }
    }
  }, [selectedSize?.stock, quantity]);

  const premiumFeatures = useMemo(() => [
    { icon: <PremiumIcons.Shield />, text: 'Authentic Scent', desc: '100% Genuine' },
    { icon: <PremiumIcons.Truck />, text: 'India Shipping', desc: 'Express Delivery' },
    { icon: <PremiumIcons.Star />, text: 'Rare Quality', desc: 'Artisanal Batch' },
    { icon: <PremiumIcons.Package />, text: 'Luxury Box', desc: 'Premium Unboxing' }
  ], []);

  if (loading) {
    return <ProductSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <h3 className="text-xl font-serif text-neutral-900 mb-2 uppercase tracking-widest">Masterpiece Not Found</h3>
        <Link to="/" className="mt-6 px-8 py-3 bg-neutral-900 text-white rounded-full text-[14px] font-black uppercase tracking-widest hover:bg-[#640d14] transition-all">
          Return to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen selection:bg-[#640d14]/10 selection:text-[#640d14] [&_a]:no-underline">
      {/* Breadcrumb */}
      <nav className="max-w-[1400px] mx-auto px-6 pt-8 pb-6 border-b border-neutral-100">

  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em]">

    <Link
      to="/"
      className="text-neutral-400 hover:text-[#640d14] transition-colors duration-300"
    >
      Home
    </Link>

    <span className="text-neutral-300">—</span>

    <Link
      to="/category"
      className="text-neutral-400 hover:text-[#640d14] transition-colors duration-300"
    >
      Collection
    </Link>

    <span className="text-neutral-300">—</span>

    <span className="text-[#640d14] truncate max-w-[240px]">
      {product.name}
    </span>

  </div>

</nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-10">
        <div className="flex flex-col lg:flex-row gap-20 lg:gap-28 items-start">

          {/* Gallery Section */}
          <div className="w-full lg:w-[55%] lg:sticky lg:top-24 space-y-8">
            <div className="relative aspect-[4/5] bg-[#fdfdfd] rounded-[64px] overflow-hidden border border-neutral-100 group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] transition-all duration-1000 hover:shadow-[0_50px_80px_-20px_rgba(0,0,0,0.08)]">
              <img
                src={selectedImage}
                alt={product.name}
                className={`w-full h-full object-contain p-8 md:p-16 lg:p-20 transition-all duration-1000 group-hover:scale-110 ${isSelectedSizeOut ? 'grayscale opacity-40' : ''}`}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x1000/f9f9f7/666?text=Perfume'; }}
              />

              {/* Overlay elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              {product.badge && (
                <div className="absolute top-12 left-12">
                  <div className="relative group/badge">
                    <div className="absolute inset-0 bg-[#640d14]/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative px-6 py-2.5 bg-[#640d14] text-white text-[9px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl backdrop-blur-md">
                      {product.badge}
                    </div>
                  </div>
                </div>
              )}

              {isSelectedSizeOut && !isPreOrder && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-px bg-neutral-900/20"></div>
                    <span className="px-10 py-4 bg-neutral-900 text-white text-[14px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl">Currently Unavailable</span>
                    <div className="w-16 h-px bg-neutral-900/20"></div>
                  </div>
                </div>
              )}

              {isPreOrder && (
                <div className="absolute top-12 right-12">
                  <div className="px-6 py-2.5 bg-amber-600/10 text-amber-700 border border-amber-600/20 text-[9px] font-black uppercase tracking-[0.5em] rounded-full shadow-2xl backdrop-blur-md">
                    Pre-Order Only
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-5 overflow-x-auto py-4 no-scrollbar px-2 justify-center lg:justify-start">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-28 h-28 rounded-[32px] overflow-hidden border transition-all duration-700 relative group ${selectedImage === img ? 'border-[#640d14] ring-[6px] ring-[#640d14]/5 scale-105' : 'border-neutral-100 opacity-60 hover:opacity-100 hover:border-neutral-200'}`}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-contain p-4 bg-[#fdfdfd]" />
                    {selectedImage === img && (
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#640d14] rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="w-full lg:w-[40%] space-y-8 pt-4 antialiased">
            {/* Header: Brand & Essence */}
            <div className="space-y-8">

              {/* Brand + Note */}
              <div className="flex items-center gap-4">

                <span className="text-[13px] font-semibold uppercase tracking-[0.45em] text-[#640d14]">
                  {product.brand}
                </span>

                {product.note && (
                  <>
                    <div className="w-[1px] h-4 bg-neutral-200"></div>

                    <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-400 italic">
                      {product.note} Essence
                    </span>
                  </>
                )}

              </div>



              {/* Product Title */}
              <div className="space-y-4">

                <h1 className="text-4xl lg:text-[42px] font-serif text-neutral-900 leading-tight tracking-tight uppercase">
                  {product.name}
                </h1>


                {/* Price */}
                <div className="flex items-center gap-5">

                  <span className="text-[28px] font-light italic text-neutral-900">
                    ₹{formatPrice(selectedSize.price)}
                  </span>

                  {selectedSize.oldPrice && (
                    <span className="text-[15px] text-neutral-400 line-through font-light">
                      ₹{formatPrice(selectedSize.oldPrice)}
                    </span>
                  )}

                </div>

              </div>



              {/* Size Section */}
              <div className="space-y-5">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">

                  <span className="text-[14px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
                    Select Volume
                  </span>

                  <span className="text-[14px] uppercase tracking-[0.35em] text-neutral-300">
                    {sizesArr.length} Editions
                  </span>

                </div>



                {/* Size Grid */}
                <div className="grid grid-cols-3 gap-3">

                  {sizesArr.map((sz, idx) => (

                    <button
                      key={idx}
                      onClick={() => setSelectedSizeIdx(idx)}
                      className={`relative flex items-center justify-center h-12 border transition-all duration-400

      ${selectedSizeIdx === idx
                          ? "border-[#640d14] text-[#640d14] bg-[#640d14]/5"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                        }

      ${sz.isOutOfStock ? "opacity-50" : ""}
      `}
                    >

                      {/* ML Text */}
                      <span className="text-[12px] font-semibold uppercase tracking-widest text-center">
                        {sz.size}
                      </span>

                      {/* Selected underline */}
                      {selectedSizeIdx === idx && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-[#640d14]"></span>
                      )}

                      {/* Out of stock label */}
                      {sz.isOutOfStock && (
                        <span className="absolute top-1 right-2 text-[8px] uppercase tracking-wider text-red-500">
                          Out
                        </span>
                      )}

                    </button>

                  ))}

                </div>

              </div>

            </div>

            {/* CTA & Quantity Section */}
            <div className="space-y-5" id="main-buy-buttons">
              <div className="flex flex-col gap-4">

                <div className="flex flex-col sm:flex-row items-stretch gap-3 min-h-[56px]">

                  {/* Quantity */}
                  <div className="flex items-center justify-between bg-white px-4 rounded-sm border border-neutral-200 h-14 shadow-sm w-full sm:w-auto">

                    <button
                      onClick={() => handleQuantityChange(-1, selectedSize?.stock)}
                      disabled={quantity <= 1 || isSelectedSizeOut}
                      className="p-2 text-neutral-400 hover:text-[#640d14] transition"
                    >
                      <MdRemove className="text-[15px]" />
                    </button>

                    <span className="text-[15px] font-semibold text-neutral-900 w-10 text-center tabular-nums">
                      {quantity}
                    </span>

                    <button
                      onClick={() => handleQuantityChange(1, selectedSize?.stock)}
                      disabled={isSelectedSizeOut || (selectedSize?.stock != null && quantity >= Number(selectedSize?.stock))}
                      className="p-2 text-neutral-400 hover:text-[#640d14] transition"
                    >
                      <MdAdd className="text-[15px]" />
                    </button>

                  </div>


                  {/* Premium Add To Cart / Pre-Order */}
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={(!isPreOrder && (isSelectedSizeOut || isAlreadyInCart)) || buttonLoading}
                      className={`flex-1 relative flex items-center justify-center overflow-hidden rounded-sm h-14
          uppercase tracking-[0.35em] text-[13px] font-semibold
          transition-all duration-500 group
          ${isPreOrder
                          ? "bg-amber-600/10 text-amber-700 border border-amber-600/20 hover:bg-amber-600/20"
                          : (isSelectedSizeOut || isAlreadyInCart
                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                            : "bg-neutral-900 text-white hover:bg-[#640d14]")
                        }`}
                    >

                      {/* Shine animation */}
                      {!isPreOrder && !isSelectedSizeOut && !isAlreadyInCart && !buttonLoading && (
                        <span className="absolute inset-0 overflow-hidden">
                          <span className="absolute -left-[120%] top-0 h-full w-[40%] bg-white/20 blur-md
              group-hover:left-[120%] transition-all duration-1000"></span>
                        </span>
                      )}

                      <div className="relative flex items-center justify-center gap-3">

                        {buttonLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>ADDING</span>
                          </>
                        ) : (
                          <>
                            {isPreOrder
                              ? <i className="fab fa-whatsapp"></i>
                              : (isSelectedSizeOut
                                ? <i className="fas fa-ban"></i>
                                : (isAlreadyInCart
                                  ? <i className="fas fa-check"></i>
                                  : <MdShoppingCart className="text-lg" />
                                )
                              )
                            }

                            <span>
                              {isPreOrder
                                ? "PRE ORDER"
                                : (isSelectedSizeOut
                                  ? "SOLD OUT"
                                  : (isAlreadyInCart
                                    ? "IN CART"
                                    : "ADD TO CART"
                                  )
                                )
                              }
                            </span>
                          </>
                        )}

                      </div>

                    </button>

                    {/* Wishlist Mobile/Small Screens */}
                    <WishlistButton
                      product={product}
                      size="large"
                      className="!rounded-sm !h-14 !w-14 flex-shrink-0 border border-neutral-200 hover:border-[#640d14] transition sm:hidden"
                    />
                  </div>

                  {/* Wishlist Desktop */}
                  <WishlistButton
                    product={product}
                    size="large"
                    className="!rounded-sm !h-14 !w-14 flex-shrink-0 border border-neutral-200 hover:border-[#640d14] transition hidden sm:flex"
                  />

                </div>



                {/* PREMIUM BUY NOW */}
                {!isAlreadyInCart && !isSelectedSizeOut && !isPreOrder && (
                  <button
                    onClick={handleBuyNow}
                    disabled={buyNowLoading}
                    className="relative w-full h-14 overflow-hidden
        bg-[#640d14] text-white
        uppercase tracking-[0.35em] text-[13px] font-semibold
        flex items-center justify-center
        group transition-all duration-500 shadow-xl"
                  >

                    {/* moving gradient */}
                    <span className="absolute inset-0 bg-gradient-to-r from-[#640d14] via-[#8c1720] to-[#640d14]
        bg-[length:200%_100%] animate-[shine_3s_linear_infinite]"></span>

                    {/* content */}
                    <span className="relative flex items-center gap-3">

                      {buyNowLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <MdFlashOn className="text-lg" />
                          BUY IT NOW
                        </>
                      )}

                    </span>

                  </button>
                )}

              </div>
            </div>

            {/* Footer: Details & Features */}
            <div className="pt-8 border-t border-neutral-100">

  <div className="grid grid-cols-2 gap-x-8 gap-y-5">

    {premiumFeatures.map((feature, i) => (
      <div
        key={i}
        className="flex items-center gap-3 group transition-all duration-300"
      >

        {/* Icon */}
        <div className="flex items-center justify-center w-7 h-7 text-[#640d14] text-[16px] transition-transform duration-300 group-hover:scale-110">
          {feature.icon}
        </div>

        {/* Text */}
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 group-hover:text-neutral-900 transition-colors">
          {feature.text}
        </span>

      </div>
    ))}

  </div>


              {/* Refined Accordion */}
              <div className="divide-y divide-neutral-50 border-y border-neutral-50">
                {['description', 'shipping'].map((tab) => (
                  <div key={tab} className="group">
                    <button
                      onClick={() => setAccordionOpen(accordionOpen === tab ? '' : tab)}
                      className="w-full flex items-center justify-between py-4 group"
                    >
                      <span className="text-[14px] font-bold uppercase tracking-[0.3em] text-neutral-800 group-hover:text-[#640d14] transition-colors">
                        {tab === 'description' ? 'Description' : 'Provenance & Care'}
                      </span>
                      <span className={`text-[14px] transition-transform duration-500 ${accordionOpen === tab ? 'rotate-45 text-[#640d14]' : 'text-neutral-300'}`}>
                        <i className="fas fa-plus"></i>
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-700 ease-in-out ${accordionOpen === tab ? 'max-h-60 pb-6' : 'max-h-0'}`}>
                      <p className="text-[15px] leading-relaxed text-neutral-500 font-medium italic pr-4">
                        {tab === 'description'
                          ? (product.data || 'An artisanal blend of rare essences, balanced to define modern luxury.')
                          : 'Secure, temperature-controlled shipping. 100% genuine verified batch codes.'}
                      </p>
                    </div>
                  </div>
                ))}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Reviews Section - Full Width */}
      <section className="bg-white py-14 border-t border-neutral-100">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col items-center text-center space-y-4 mb-16">
            <span className="text-[14px] font-black text-[#640d14] uppercase tracking-[0.6em]">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 uppercase tracking-[0.2em]">Customer Reflections</h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#640d14]/20 to-transparent"></div>
            <p className="text-neutral-400 text-[10px] uppercase tracking-[0.3em] font-bold">Total Reviews: ({reviews.length})</p>
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#640d14]/10 border-t-[#640d14] rounded-full animate-spin"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 font-serif italic text-lg uppercase tracking-widest">No reflections shared yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map(review => (
                <div key={review.id} className="p-8 bg-[#fdfdfd] rounded-[32px] border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-700 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex text-[#f59e0b] text-[10px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      {review.size && (
                        <span className="text-[9px] uppercase font-black tracking-widest text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">{review.size}</span>
                      )}
                    </div>
                    <p className="text-[15px] text-neutral-600 leading-relaxed font-medium italic">"{review.text}"</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-neutral-50 flex items-center justify-between">
                    <span className="font-black text-[10px] text-neutral-900 uppercase tracking-widest">{review.userName}</span>
                    {review.createdAt && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-300">
                        {new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-IN', {
                          month: 'short', year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related Curation */}
      <section className="bg-[#fafafa] py-32 border-t border-neutral-100 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/50 to-transparent pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-4 mb-20">
            <span className="text-[14px] font-black text-[#640d14] uppercase tracking-[0.6em]">Recommended</span>
            <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 uppercase tracking-[0.2em]">The Curation</h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#640d14]/20 to-transparent"></div>
          </div>

          {relatedLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#640d14]/10 border-t-[#640d14] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {relatedProducts.map((p) => {
                const rPrice = p.sizes?.[0]?.price || p.price;
                return (
                  <Link key={p.id} to={`/product/${p.id}`} className="group space-y-6">
                    <div className="relative aspect-[4/5] bg-white rounded-[48px] overflow-hidden border border-neutral-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.02)] transition-all duration-1000 group-hover:shadow-[0_40px_60px_-20px_rgba(0,0,0,0.1)] group-hover:-translate-y-3">
                      <img
                        src={getProductPrimaryImage(p)}
                        alt={p.name}
                        className="w-full h-full object-contain p-8 transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="px-8 py-3 bg-white text-neutral-900 text-[14px] font-black uppercase tracking-[0.3em] rounded-full transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 shadow-xl">Explore</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-[9px] font-black text-[#640d14] uppercase tracking-[0.4em] opacity-50">{p.brand}</p>
                      <h3 className="text-[12px] font-serif text-neutral-900 group-hover:text-[#640d14] transition-colors duration-500 uppercase tracking-widest truncate px-4">{p.name}</h3>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-[14px] font-black text-neutral-900">₹{formatPrice(rPrice)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sticky Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-[100] transform transition-transform duration-500 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          {/* Product Minimal Info */}
          <div className="hidden md:flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
              <img src={selectedImage} alt={product.name} className="w-full h-full object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[14px] font-black uppercase tracking-widest text-neutral-900 truncate">{product.name}</h4>
              <p className="text-[10px] font-bold text-[#640d14] tracking-wider">₹{formatPrice(selectedSize.price)}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-1 items-center justify-end gap-3 max-w-2xl ml-auto">
            {/* Quantity */}
            <div className="flex items-center bg-neutral-50 h-11 px-3 rounded-sm border border-neutral-100">
              <button
                onClick={() => handleQuantityChange(-1, selectedSize?.stock)}
                disabled={quantity <= 1 || isSelectedSizeOut}
                className="text-neutral-400 hover:text-[#640d14] p-1"
              >
                <MdRemove className="text-[14px]" />
              </button>
              <span className="text-[13px] font-bold text-neutral-900 w-8 text-center">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1, selectedSize?.stock)}
                disabled={isSelectedSizeOut || (selectedSize?.stock != null && quantity >= Number(selectedSize?.stock))}
                className="text-neutral-400 hover:text-[#640d14] p-1"
              >
                <MdAdd className="text-[14px]" />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 flex-1 md:flex-none items-center">
              <button
                onClick={handleAddToCart}
                disabled={(!isPreOrder && (isSelectedSizeOut || isAlreadyInCart)) || buttonLoading}
                className={`flex-1 md:w-44 h-11 rounded-sm text-[14px] font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2
                  ${isPreOrder ? "bg-amber-600/10 text-amber-700 border border-amber-600/20 hover:bg-amber-600/20 shadow-lg shadow-amber-600/5" : (isSelectedSizeOut || isAlreadyInCart ? "bg-neutral-100 text-neutral-400" : "bg-neutral-900 text-white hover:bg-[#640d14]")}`}
              >
                {buttonLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isPreOrder ? <i className="fab fa-whatsapp"></i> : <MdShoppingCart />)}
                <span>{isPreOrder ? "Pre-Order" : (isSelectedSizeOut ? "Sold Out" : (isAlreadyInCart ? "In Cart" : "Add to Cart"))}</span>
              </button>

              {!isAlreadyInCart && !isSelectedSizeOut && !isPreOrder && (
                <button
                  onClick={handleBuyNow}
                  disabled={buyNowLoading}
                  className="flex-1 md:w-44 h-11 bg-[#640d14] text-white rounded-sm text-[14px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {buyNowLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <MdFlashOn className="text-sm" />}
                  <span>Buy It Now</span>
                </button>
              )}

              {/* Wishlist Icon in Sticky Bar */}
              <WishlistButton
                product={product}
                size="medium"
                className="!rounded-sm !h-11 !w-11 flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
