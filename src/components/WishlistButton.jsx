import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function WishlistButton({ product, className = '', size = 'medium', showText = false, showIcon = true }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToast('Please login to add items to wishlist', 'info');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        showToast('Removed from wishlist', 'info');
      } else {
        const result = await addToWishlist(product);
        if (!result.success) {
          showToast(result.message, 'error');
        } else {
          showToast('Product added to wishlist', 'success');
        }
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlistState = isInWishlist(product.id);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-14 h-14'
  };

  const buttonClass = `flex items-center justify-center rounded-full transition-all duration-300 shadow-md relative overflow-hidden group
    ${isInWishlistState 
      ? 'bg-[#640d14] text-white hover:bg-[#8b1a23] scale-110' 
      : 'bg-white/95 backdrop-blur-md text-[#640d14] hover:bg-[#640d14] hover:text-white hover:scale-110'
    } ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={buttonClass}
      onClick={handleWishlistToggle}
      disabled={isLoading}
      title={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
      ) : (
        <>
          {showIcon && (
            <svg 
              width={size === 'small' ? '14' : size === 'large' ? '24' : '16'} 
              height={size === 'small' ? '14' : size === 'large' ? '24' : '16'} 
              viewBox="0 0 24 24" 
              fill={isInWishlistState ? 'currentColor' : 'none'}
              stroke="currentColor" 
              strokeWidth="2"
              className={`transition-transform duration-300 ${isInWishlistState ? 'scale-110' : 'group-hover:scale-110'}`}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          )}
          {showText && (
            <span className="ml-2 text-[10px] font-black uppercase tracking-widest">
              {isInWishlistState ? 'Remove' : 'Wishlist'}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default WishlistButton; 