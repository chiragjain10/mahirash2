import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import BannerSkeleton from './BannerSkeleton';

const FullScreenBanner = () => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(''); // no default
  const [hasImage, setHasImage] = useState(false); // default to false

  const handleClick = () => {
    navigate('/category');
  };

  useEffect(() => {
    // Load directly from Firestore - banner image
    const ref = doc(db, 'siteConfig', 'videos');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const nextUrl = data?.bannerImageUrl || '';
        if (nextUrl) {
          setImageUrl(nextUrl)
          setHasImage(true);
        } else {
          setImageUrl('');
          setHasImage(false);
        }
      },
      (error) => {
        console.error('Error loading banner image config:', error);
        setHasImage(false);
      }
    );

    return () => unsub();
  }, []);

  if (!hasImage || !imageUrl) return null; // Only show if we have an uploaded image

  return (
    <section className="bg-white">
      <div className="">
        <div 
          onClick={handleClick} 
          className="block overflow-hidden rounded-2xl shadow-sm cursor-pointer"
        >
          <img 
            src={imageUrl} 
            alt="Mahirash Perfume Banner" 
            className="w-full h-[75vh] object-cover hover:scale-[1.01] transition-transform duration-700"
          />
        </div>
      </div>
    </section>
  );
};

export default FullScreenBanner;
