import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop All', to: '/category' },
  {
    label: 'Categories',
    to: '/category',
    dropdown: ['Designer', 'Middle Eastern', 'Niche', 'Vials', 'Gift Sets']
  },
  { label: 'Our Story', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Menu({ drawerOpen, setDrawerOpen }) {
  const location = useLocation();

  return (
    <>
      {/* Desktop Menu */}
      <nav className="mahirash-menu hidden lg:block">
        <div className="container">
          <ul className="menu-list">
            {navLinks.map(link => (
              <li key={link.label} className="menu-item">
                <Link
                  to={link.to}
                  className={location.pathname === link.to ? 'active' : ''}
                >
                  {link.label}
                  {link.dropdown && <span className="dropdown-icon">▼</span>}
                </Link>
                {link.dropdown && (
                  <div className="dropdown-menu">
                    {link.dropdown.map(item => (
                      <Link 
                        key={item} 
                        to={`/category?type=${item.toLowerCase()}`}
                        className="dropdown-item"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[2000] lg:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-10">
              <img src="/images/logom.png" alt="Logo" className="h-8" />
              <button onClick={() => setDrawerOpen(false)} className="text-2xl">&times;</button>
            </div>
            <ul className="space-y-6">
              {navLinks.map(link => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-sm uppercase tracking-widest text-[#454545] font-medium"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
