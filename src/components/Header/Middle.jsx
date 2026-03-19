import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Middle({ setDrawerOpen }) {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle escape key to close search
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSearchBar) {
        handleSearchClose();
      }
    };

    if (showSearchBar) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSearchBar]);

  const handleAccountClick = (e) => {
    e.preventDefault();
    navigate('/account');
  };

  const handleSearchClick = () => {
    setShowSearchBar(!showSearchBar);
    if (showSearchBar) {
      setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchBar(false);
      setSearchQuery('');
    }
  };

  const handleSearchClose = () => {
    setShowSearchBar(false);
    setSearchQuery('');
  };

  const handleSearchOverlayClick = (e) => {
    if (e.target.classList.contains('search-overlay')) {
      handleSearchClose();
    }
  };

  return (
    <div className="mahirash-middlebar">
      <div className="container middlebar-flex">
        <div className="middlebar-left">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-[#454545]"
              onClick={() => setDrawerOpen && setDrawerOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="hidden lg:flex items-center gap-4">
              <a href="https://www.instagram.com/mahirash_perfumes/" target="_blank" rel="noopener noreferrer" className="text-[#454545] hover:opacity-70 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.facebook.com/mahirashperfumes" target="_blank" rel="noopener noreferrer" className="text-[#454545] hover:opacity-70 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
            <button className="text-[#454545] hover:opacity-70 transition-opacity" onClick={handleSearchClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
        <div className="middlebar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/images/logom.png" alt="Mahirash Logo" />
        </div>
        <div className="middlebar-icons">
          <button
            className="icon-btn hidden lg:flex"
            title="Account"
            onClick={handleAccountClick}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <Link to="/wishlist" className="icon-btn wishlist-icon" title="Wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {getWishlistCount() > 0 && (
              <span className="cart-badge">{getWishlistCount()}</span>
            )}
          </Link>
          <Link to="/chart" className="icon-btn cart-icon" title="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {getCartCount() > 0 && (
              <span className="cart-badge">{getCartCount()}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="search-overlay" onClick={handleSearchOverlayClick}>
          <div className="search-container">
            <div className="search-header">
              <h3 className="search-title">Search Our Collection</h3>
              <button
                type="button"
                className="search-close-icon-btn"
                onClick={handleSearchClose}
                aria-label="Close search"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="search-form-v2">
              <div className="search-input-wrapper-v2">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-v2"
                  autoFocus
                />
                <button type="submit" className="search-submit-btn-v2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>
            </form>
            <div className="search-suggestions">
              <p className="suggestion-label">Popular Searches:</p>
              <div className="suggestion-tags">
                <button onClick={() => { setSearchQuery('Designer'); navigate('/category/Designer'); setShowSearchBar(false); }} className="suggestion-tag">Designer</button>
                <button onClick={() => { setSearchQuery('Niche'); navigate('/category/niche'); setShowSearchBar(false); }} className="suggestion-tag">Niche</button>
                <button onClick={() => { setSearchQuery('Middle Eastern'); navigate('/category/Middle%20eastern'); setShowSearchBar(false); }} className="suggestion-tag">Middle Eastern</button>
                <button onClick={() => { setSearchQuery('Gift Sets'); navigate('/category/Gift%20sets'); setShowSearchBar(false); }} className="suggestion-tag">Gift Sets</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 