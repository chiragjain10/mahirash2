import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuickView from '../components/QuickView';
import { MdDeleteOutline, MdShoppingCart, MdClose } from 'react-icons/md';
import { IoLogoWhatsapp } from 'react-icons/io';
import { HiOutlineShoppingBag } from 'react-icons/hi';

function Wishlist() {
  const { wishlistItems, removeFromWishlist, clearWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); // { productId: sizeIndex }

  const formatPrice = (price) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  // Helpers for size, image and pricing
  const getSizesArray = (product) => Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : [{
      size: product.size || 'Standard',
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock !== undefined ? product.stock : 999, // Default to 999 for old products
      images: [product.image, product.hoverImage, product.image3, product.image4].filter(Boolean),
      isOutOfStock: !!product.isOutOfStock,
      isPreOrder: !!product.isPreOrder
    }];

  function getPrimaryImage(product, selectedIdx = 0) {
    const sizes = getSizesArray(product);
    const selected = sizes[selectedIdx] || sizes[0];
    if (selected && Array.isArray(selected.images) && selected.images[0]) return selected.images[0];
    return product.image || '';
  }

  const handleAddToCart = async (product) => {
    const sizes = getSizesArray(product);
    const selectedIdx = selectedSizes[product.id] || 0;
    const selectedSize = sizes[selectedIdx] || sizes[0];

    // STRICT BLOCK for Pre-Order
    if (selectedSize.isPreOrder) {
      const phoneNumber = '919584826112';
      const productName = product?.name || 'product';
      const sizeLabel = selectedSize?.size ? ` (${selectedSize.size})` : '';
      const message = `Hi! I'm interested in Pre-ordering the "${productName}${sizeLabel}" from my Wishlist. Please let me know how to proceed.`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }

    if (selectedSize.isOutOfStock) return;

    setLoadingProducts(prev => ({ ...prev, [product.id]: true }));
    
    await new Promise(res => setTimeout(res, 600));
    
    const productWithSize = {
      ...product,
      selectedSize
    };
    
    addToCart(productWithSize);
    
    setLoadingProducts(prev => ({ ...prev, [product.id]: false }));
    
    const offcanvas = document.getElementById('shoppingCart');
    if (offcanvas && window.bootstrap) {
      const bsOffcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(offcanvas);
      bsOffcanvas.show();
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    await removeFromWishlist(productId);
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

  const handleClearWishlist = async () => {
    await clearWishlist();
    setShowClearConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-slate-900 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading your wishlist...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-4xl mb-6 animate-bounce">💝</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your wishlist</h2>
        <p className="text-gray-500 mb-8 max-w-sm">Create an account or sign in to save your favorite products and sync them across devices.</p>
        <button 
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
          onClick={() => navigate('/login')}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gray-50/50 border-b border-gray-100 py-12 md:py-20">
        <div className="px-4 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1400px] mx-auto">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">My Wishlist</h1>
            <p className="text-gray-500 font-medium">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          
          {wishlistItems.length > 0 && (
            <button 
              className="self-start md:self-center px-6 py-2.5 border-2 border-red-100 text-red-600 rounded-full text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
              onClick={() => setShowClearConfirm(true)}
            >
              <MdDeleteOutline className="w-5 h-5" />
              Clear Wishlist
            </button>
          )}
        </div>
      </div>

      {/* Wishlist Content */}
      <div className="px-4 py-12 max-w-[1400px] mx-auto">
        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-6 opacity-50">💝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-xs">Start adding products to your wishlist while you browse our collections.</p>
            <button 
              className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
              onClick={() => navigate('/category')}
            >
              <HiOutlineShoppingBag className="w-5 h-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {wishlistItems.map((product) => {
              const sizesArr = getSizesArray(product);
              const selectedIdx = selectedSizes[product.id] || 0;
              const selectedSize = sizesArr[selectedIdx] || sizesArr[0];
              const isPreOrder = !!selectedSize.isPreOrder;
              const stockNum = Number(selectedSize.stock !== undefined ? selectedSize.stock : 999);
              const isOutOfStock = !!selectedSize.isOutOfStock || (!isPreOrder && stockNum <= 0);

              return (
                <div 
                  className="group bg-white border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300" 
                  key={product.id}
                >
                  {/* Image Container */}
                  <div className="relative w-full md:w-48 h-64 md:h-48 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    <img 
                      src={getPrimaryImage(product, selectedIdx)} 
                      alt={product.name} 
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-700"
                      onClick={() => handleCardClick(product)}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.badge && (
                        <span className="bg-slate-900 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          {product.badge}
                        </span>
                      )}
                      {isPreOrder && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          Pre-Order
                        </span>
                      )}
                    </div>

                    {isOutOfStock && !isPreOrder && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="text-red-600 font-black uppercase tracking-widest text-xs border-2 border-red-600 px-3 py-1.5 rounded-lg rotate-12">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h3 
                          className="text-xl font-bold text-slate-900 hover:text-slate-700 cursor-pointer transition-colors"
                          onClick={() => handleCardClick(product)}
                        >
                          {product.name}
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {product.brand || 'Premium Collection'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {isPreOrder ? (
                            <span className="text-[10px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded tracking-widest">Pre-Order</span>
                          ) : isOutOfStock ? (
                            <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded tracking-widest">Out of Stock</span>
                          ) : (
                            <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded tracking-widest">In Stock</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-900">₹{formatPrice(selectedSize.price)}</span>
                          {selectedSize.oldPrice && (
                            <span className="text-sm text-gray-400 line-through font-medium">₹{formatPrice(selectedSize.oldPrice)}</span>
                          )}
                        </div>
                        {selectedSize.oldPrice && (
                          <span className="text-[10px] font-bold text-green-600 uppercase">
                            Save ₹{formatPrice(parseFloat(selectedSize.oldPrice) - parseFloat(selectedSize.price))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {sizesArr.map((sz, idx) => (
                        <button
                          key={idx}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                            selectedIdx === idx 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200' 
                              : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: idx }))}
                        >
                          {sz.size}
                        </button>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                            isPreOrder 
                              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100' 
                              : isOutOfStock 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200'
                          }`}
                          onClick={() => handleAddToCart(product)}
                          disabled={loadingProducts[product.id] || (isOutOfStock && !isPreOrder)}
                        >
                          {loadingProducts[product.id] ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : isPreOrder ? (
                            <>
                              <IoLogoWhatsapp className="w-5 h-5" />
                              Pre-Order
                            </>
                          ) : isOutOfStock ? (
                            'Unavailable'
                          ) : (
                            <>
                              <MdShoppingCart className="w-5 h-5" />
                              Add to Cart
                            </>
                          )}
                        </button>
                        
                        <button 
                          className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          onClick={() => handleRemoveFromWishlist(product.id)}
                          title="Remove from wishlist"
                        >
                          <MdDeleteOutline className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <button 
                        className="hidden md:block text-xs font-bold text-gray-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
                        onClick={() => handleQuickView(product)}
                      >
                        Quick View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                <MdDeleteOutline />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Clear Wishlist?</h3>
              <p className="text-gray-500 text-sm">Are you sure you want to remove all items? This action cannot be undone.</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button 
                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
                onClick={handleClearWishlist}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Wishlist; 