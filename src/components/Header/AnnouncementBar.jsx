import React, { useState, useEffect } from "react";
import { db } from "../../components/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
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
    <div className="bg-[#640d14] text-white h-10 flex items-center relative group">
      
      <div className="w-full max-w-[1400px] mx-auto px-4">
        <Swiper
          modules={[Autoplay, Navigation]}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          navigation={{
            nextEl: '.announcement-next',
            prevEl: '.announcement-prev',
          }}
          loop={announcements.length > 1}
          className="h-full"
        >
          {announcements.map((item, index) => (
            <SwiperSlide key={item.id || index}>
              <div className="flex items-center justify-center h-full">
                <p className="text-white text-xs md:text-sm  mt-3 uppercase tracking-[0.2em] font-small text-center leading-none">
                  {item.text}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Navigation Arrows */}
      <button className="announcement-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition duration-300">
        <svg className="text-white w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <button className="announcement-next absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition duration-300">
        <svg className="text-white w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
}