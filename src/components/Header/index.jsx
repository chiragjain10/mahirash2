import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Middle from "./Middle";
import Menu from "./Menu";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Scroll state
          setIsScrolled(currentScrollY > 50);

          // Hide / Show logic
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setShowHeader(false); // scrolling down
          } else {
            setShowHeader(true); // scrolling up
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
        
        ${showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
        
        ${isScrolled
            ? "bg-white/70 backdrop-blur-xl shadow-lg border-b border-gray-200"
            : "bg-transparent"
          }
      `}
      >
        <div className="transition-all duration-500">
          <AnnouncementBar />
          <Middle setDrawerOpen={setDrawerOpen} />
          <Menu drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t shadow-md md:hidden z-50">
        <ul className="flex justify-around items-center py-2 text-xs">

          <li className="relative group">
            <Link to="/category" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition">
              <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              <span>Categories</span>
            </Link>

            {/* Hover Dropdown */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white border border-gray-100 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
              <div className="flex flex-col py-2">
                {['Designer', 'Middle eastern', 'niche', 'Vials', 'Gift sets', 'Combo'].map((item) => (
                  <Link
                    key={item}
                    to={`/category/${encodeURIComponent(item)}`}
                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors border-b border-gray-50 last:border-0"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </li>

          <li>
            <Link to="/category" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition">
              <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Shop</span>
            </Link>
          </li>

          <li>
            <Link to="/about" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition">
              <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Our Story</span>
            </Link>
          </li>

          <li>
            <Link to="/contact" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition">
              <svg className="w-5 h-5 transition-transform duration-300 hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>Contact</span>
            </Link>
          </li>

        </ul>
      </nav>
    </>
  );
}