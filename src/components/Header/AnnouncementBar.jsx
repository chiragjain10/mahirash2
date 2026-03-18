import React, { useState, useEffect } from 'react';
import { db } from '../../components/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data.length > 0 ? data : [{ text: 'FREE SHIPPING ON ORDERS OVER ₹999' }]);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-[#640d14] text-white py-2 overflow-hidden relative group">
      <div className="max-w-[1400px] mx-auto px-10">
        <Swiper
          modules={[Autoplay, Navigation]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{
            nextEl: '.announcement-next',
            prevEl: '.announcement-prev',
          }}
          loop={announcements.length > 1}
          className="h-5"
        >
          {announcements.map((item, index) => (
            <SwiperSlide key={item.id || index}>
              <div className="flex justify-center items-center h-full">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium text-center">
                  {item.text}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Navigation Arrows */}
      <button className="announcement-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button className="announcement-next absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
}
