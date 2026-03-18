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

export default function Menu() {
  const location = useLocation();

  return (
    <nav className="mahirash-menu">
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
  );
}
