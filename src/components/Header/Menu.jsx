import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop All', to: '/category' },
  {
    label: 'Categories',
    to: '/category',
    dropdown: ['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo']
  },
  { label: 'Combo', to: '/combo' },
  { label: 'Our Story', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Menu({ drawerOpen, setDrawerOpen }) {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <>
      {/* Desktop Menu */}
      <nav className="mahirash-menu hidden lg:block">
        <div className="container">
          <ul className="menu-list">
            {navLinks.map(link => (
              <li
                key={link.label}
                className="menu-item relative"
                onMouseEnter={() => setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={link.to}
                  className={location.pathname === link.to ? 'active flex items-center gap-1' : 'flex items-center gap-1'}
                >
                  {link.label}
                  {link.dropdown && <span className="dropdown-icon ml-1">▼</span>}
                </Link>
                {link.dropdown && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{
                      opacity: openDropdown === link.label ? 1 : 0,
                      visibility: openDropdown === link.label ? 'visible' : 'hidden',
                      transform:
                        openDropdown === link.label
                          ? 'translateX(-50%) translateY(0)'
                          : 'translateX(-50%) translateY(10px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div className="flex flex-col py-2">
                      {link.dropdown.map(item => (
                        <Link 
                          key={item} 
                          to={`/category/${encodeURIComponent(item)}`}
                          className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors border-b border-gray-50 last:border-0 whitespace-nowrap"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
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
                  {link.dropdown && (
                    <div className="pl-4 mt-3 flex flex-col space-y-3">
                      {link.dropdown.map(item => (
                        <Link 
                          key={item} 
                          to={`/category/${encodeURIComponent(item)}`}
                          className="text-xs uppercase tracking-widest text-gray-500 hover:text-black"
                          onClick={() => setDrawerOpen(false)}
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
        </div>
      </div>
    </>
  );
}
