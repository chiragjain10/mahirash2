import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { usePreloader } from '../context/PreloaderContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { MdShoppingCart, MdAdd, MdRemove, MdClose, MdFlashOn } from 'react-icons/md';

function QuickView({ product, onClose }) {
    const { addToCart, isInCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [buyNowLoading, setBuyNowLoading] = useState(false);
    const [selectedSizeIdx, setSelectedSizeIdx] = useState(0);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // Handle Escape key to close
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!product) return null;

    const sizesArr = useMemo(() => {
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

        return baseSizes.map(sz => ({
            ...sz,
            isOutOfStock: (Number(sz.stock) <= 0 && sz.stock !== undefined) || !!sz.isOutOfStock
        }));
    }, [product]);

    // Priority logic for default size
    const preferredIdx = useMemo(() => {
        let idx = -1;
        if (product.fromBannerFresh) {
            idx = sizesArr.findIndex(s => s.size === '10ml');
            if (idx === -1) idx = sizesArr.findIndex(s => s.size === '50ml');
        } else {
            idx = sizesArr.findIndex(s => s.size === '50ml');
        }
        
        if (idx === -1 || sizesArr[idx]?.isOutOfStock) {
            const firstIn = sizesArr.findIndex(s => !s.isOutOfStock);
            return firstIn !== -1 ? firstIn : 0;
        }
        return idx;
    }, [sizesArr, product.fromBannerFresh]);

    useEffect(() => {
        setSelectedSizeIdx(preferredIdx);
    }, [preferredIdx]);

    const selectedSize = sizesArr[selectedSizeIdx] || sizesArr[0];
    const isPreOrder = !!selectedSize?.isPreOrder;
    const isSelectedSizeOut = !isPreOrder && !!selectedSize?.isOutOfStock;
    const isAlreadyInCart = isInCart(product.id, selectedSize.size);

    const productImages = useMemo(() => {
        return Array.isArray(selectedSize?.images) && selectedSize.images.length > 0
            ? selectedSize.images
            : [product.image, product.hoverImage, product.image3, product.image4].filter(Boolean);
    }, [selectedSize, product]);

    useEffect(() => {
        setSelectedImage(productImages[0] || '');
    }, [productImages]);

    const formatPrice = (price) => {
        const num = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleQuantityChange = (delta) => {
        setQuantity((prev) => {
            const stockVal = selectedSize?.stock != null ? Number(selectedSize.stock) : Infinity;
            return Math.min(stockVal, Math.max(1, prev + delta));
        });
    };

    const handleAddToCart = async () => {
        if (isPreOrder) {
            const phoneNumber = '919584826112';
            const message = `Hi! I'm interested in Pre-ordering "${product.name}" (${selectedSize.size}).`;
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
            return;
        }
        if (buttonLoading || isSelectedSizeOut || isAlreadyInCart) return;
        setButtonLoading(true);
        await new Promise(res => setTimeout(res, 600));
        addToCart({ ...product, quantity, selectedSize });
        setButtonLoading(false);
        const offcanvas = document.getElementById('shoppingCart');
        if (offcanvas && window.bootstrap) {
            const bsOffcanvas = new window.bootstrap.Offcanvas(offcanvas);
            bsOffcanvas.show();
        }
    };

    const handleBuyNow = useCallback(async () => {
        if (isPreOrder) {
            const phoneNumber = '919584826112';
            const productName = product?.name || 'product';
            const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
            const message = `Hi! I'm interested in Pre-ordering the "${productName}${sizeLabel}". Please let me know how to proceed.`;
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
            return;
        }
        if (isSelectedSizeOut) return;

        if (!user) {
            navigate('/login', { state: { from: `/product/${product.id}` } });
            onClose();
            return;
        }

        setBuyNowLoading(true);
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
        onClose();
    }, [isPreOrder, isSelectedSizeOut, user, navigate, product, quantity, selectedSize, onClose]);

    const MAX_CHARS = 240;
    const truncatedDesc = product.data && product.data.length > MAX_CHARS 
        ? product.data.substring(0, MAX_CHARS) + '...' 
        : product.data;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 md:p-6 antialiased">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" 
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-5xl bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in duration-300">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-900 hover:bg-[#640d14] hover:text-white transition-all duration-300 shadow-lg"
                >
                    <MdClose size={24} />
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 bg-[#fdfdfd] p-8 md:p-12 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-neutral-100">
                    <div className="relative w-full aspect-square flex items-center justify-center group">
                        <img 
                            src={selectedImage} 
                            alt={product.name} 
                            className={`w-full h-full object-contain transition-all duration-700 group-hover:scale-105 ${isSelectedSizeOut ? 'grayscale opacity-40' : ''}`}
                        />
                        {product.badge && (
                            <div className="absolute top-0 left-0">
                                <div className="px-6 py-2 bg-[#640d14] text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full shadow-lg">
                                    {product.badge}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {productImages.length > 1 && (
                        <div className="flex gap-4 mt-8 overflow-x-auto no-scrollbar pb-2">
                            {productImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`w-20 h-20 rounded-[24px] overflow-hidden border transition-all duration-500 flex-shrink-0 ${selectedImage === img ? 'border-[#640d14] ring-4 ring-[#640d14]/5 scale-105 shadow-md' : 'border-neutral-100 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="thumb" className="w-full h-full object-contain p-3" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto no-scrollbar flex flex-col">
                    <div className="space-y-8">
                        {/* Brand & Name */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[14px] font-bold text-[#640d14] uppercase tracking-[0.45em]">{product.brand}</span>
                                {product.note && (
                                    <>
                                        <div className="w-px h-3 bg-neutral-200" />
                                        <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 italic">{product.note} Essence</span>
                                    </>
                                )}
                            </div>
                            <h2 className="text-xl md:text-4xl font-serif text-neutral-900 uppercase tracking-tight leading-tight">{product.name}</h2>
                            <div className="flex items-baseline gap-5">
                                <span className="text-xl md:text-3xl font-light italic text-neutral-900">₹{formatPrice(selectedSize.price)}</span>
                                {selectedSize.oldPrice && (
                                    <span className="text-[12px] md:text-[15px] text-neutral-400 line-through font-light">₹{formatPrice(selectedSize.oldPrice)}</span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {product.data && (
                            <div className="space-y-3">
                                <p className="text-[14px] text-neutral-500 leading-relaxed italic pr-4">
                                    {truncatedDesc}
                                </p>
                                <button 
                                    onClick={() => {
                                        navigate(`/product/${product.id}`);
                                        onClose();
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#640d14] hover:text-black transition-colors"
                                >
                                    Discover More Detail →
                                </button>
                            </div>
                        )}

                        {/* Size Selection */}
                        {sizesArr.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                                    <span className="text-[14px] font-bold uppercase tracking-[0.35em] text-neutral-400">Select Edition</span>
                                    <span className="text-[14px] font-bold text-neutral-300 uppercase tracking-[0.3em]">{sizesArr.length} Variations</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {sizesArr.map((sz, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedSizeIdx(idx)}
                                            className={`h-11 flex items-center justify-center border transition-all duration-400 ${selectedSizeIdx === idx ? 'border-[#640d14] bg-[#640d14]/[0.05] text-[#640d14]' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'} ${sz.isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="text-[12px] font-bold uppercase tracking-widest">{sz.size}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA Section */}
                        <div className="pt-4 space-y-4">
                            <div className="flex gap-3 h-14">
                                {/* Quantity */}
                                <div className="flex items-center bg-white px-4 rounded-sm border border-neutral-200">
                                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isSelectedSizeOut} className="p-1 text-neutral-400 hover:text-[#640d14] transition-colors"><MdRemove size={16} /></button>
                                    <span className="w-10 text-center font-bold text-neutral-900 tabular-nums">{quantity}</span>
                                    <button onClick={() => handleQuantityChange(1)} disabled={isSelectedSizeOut || (selectedSize?.stock != null && quantity >= Number(selectedSize.stock))} className="p-1 text-neutral-400 hover:text-[#640d14] transition-colors"><MdAdd size={16} /></button>
                                </div>

                                {/* Add to Cart */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={(!isPreOrder && (isSelectedSizeOut || isAlreadyInCart)) || buttonLoading}
                                    className={`flex-1 rounded-sm flex items-center justify-center gap-2 md:gap-3 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.15em] md:tracking-[0.35em] transition-all duration-500 ${isPreOrder ? 'bg-amber-600/10 text-amber-700 border border-amber-600/20 hover:bg-amber-600/20 shadow-lg shadow-amber-600/5' : (isSelectedSizeOut || isAlreadyInCart ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-neutral-900 text-white hover:bg-[#640d14] shadow-xl')}`}
                                >
                                    {buttonLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isPreOrder ? <i className="fab fa-whatsapp" /> : (isSelectedSizeOut ? <i className="fas fa-ban" /> : (isAlreadyInCart ? <i className="fas fa-check" /> : <MdShoppingCart size={18} />))}
                                            <span>{isPreOrder ? "Pre-Order" : (isSelectedSizeOut ? "Sold Out" : (isAlreadyInCart ? "In Cart" : "Add to Cart"))}</span>
                                        </>
                                    )}
                                </button>

                                {/* Wishlist */}
                                <WishlistButton product={product} size="medium" className="!rounded-sm !h-14 !w-14 flex-shrink-0 border border-neutral-200 hover:border-[#640d14] transition-all" />
                            </div>

            {/* Buy Now */}
                            {!isAlreadyInCart && !isSelectedSizeOut && !isPreOrder && (
                                <button
                                    onClick={handleBuyNow}
                                    disabled={buyNowLoading}
                                    className="w-full h-12 md:h-14 bg-[#640d14] text-white uppercase tracking-[0.2em] md:tracking-[0.35em] text-[10px] md:text-[12px] font-bold flex items-center justify-center gap-3 group transition-all duration-500 shadow-lg hover:shadow-xl rounded-sm buy-now-pulse"
                                >
                                    {buyNowLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <MdFlashOn size={18} />
                                            <span>Buy It Now</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuickView;
