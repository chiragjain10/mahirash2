import React, { useState, useEffect } from 'react';
import AnnouncementBar from './AnnouncementBar';
import Topbar from './Topbar';
import Middle from './Middle';
import Menu from './Menu';
import './Header.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`mahirash-header ${isScrolled ? 'scrolled' : ''}`}>
      <AnnouncementBar />
      <Middle />
      <Menu />
    </header>
  );
} 