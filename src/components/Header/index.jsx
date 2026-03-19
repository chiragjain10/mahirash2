import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Middle from './Middle';
import Menu from './Menu';
import './Header.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`mahirash-header ${isScrolled ? 'scrolled' : ''}`}>
        <AnnouncementBar />
        <Middle setDrawerOpen={setDrawerOpen} />
        <Menu drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
      </header>

      {/* Mobile Bottom Navigation (Task 2) */}
      <nav className="mobile-bottom-nav">
        <ul className="mobile-nav-list">
          <li className="mobile-nav-item">
            <Link to="/category" className="mobile-nav-link">
              <div className="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
              </div>
              <span>Categories</span>
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/category" className="mobile-nav-link">
              <div className="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <span>Shop</span>
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/about" className="mobile-nav-link">
              <div className="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <span>Our Story</span>
            </Link>
          </li>
          <li className="mobile-nav-item">
            <Link to="/contact" className="mobile-nav-link">
              <div className="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span>Contact</span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
} 