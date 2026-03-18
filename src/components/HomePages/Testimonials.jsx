import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, Navigation } from 'swiper/modules';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const WatchAndBuy = () => {
  const [items, setItems] = useState([
    { id: 1, url: 'https://images.unsplash.com/photo-1627060352315-d239df743815?auto=format&fit=crop&q=80&w=800', tag: 'Discovery Set', isVideo: false },
    { id: 2, url: 'https://images.unsplash.com/photo-1595425959632-34f2822322ce?auto=format&fit=crop&q=80&w=800', tag: 'New Arrival', isVideo: false },
    { id: 3, url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800', tag: 'Best Seller', isVideo: false },
    { id: 4, url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800', tag: 'Limited Edition', isVideo: false },
    { id: 5, url: 'https://images.unsplash.com/photo-1615485240384-552d49d56c46?auto=format&fit=crop&q=80&w=800', tag: 'Signature', isVideo: false },
  ]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const docRef = doc(db, 'siteConfig', 'videos');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.watchAndBuyVideos && data.watchAndBuyVideos.length > 0) {
            const formattedItems = data.watchAndBuyVideos.map((v, index) => ({
              id: `video-${index}`,
              url: v.url,
              tag: v.tag,
              isVideo: true
            }));
            setItems(formattedItems);
          }
        }
      } catch (error) {
        console.error('Error fetching Watch and Buy videos:', error);
      }
    };
    fetchVideos();
  }, []);

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-16">
          <span className="text-[10px] md:text-[12px] text-[#640d14] uppercase tracking-[0.4em] font-bold mb-3 block">Mahirash </span>
          <h2 className="text-2xl md:text-4xl font-serif text-neutral-900 uppercase tracking-widest">Watch and Buy</h2>
        </div>

        <div className="px-4 md:px-10 relative group">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            slidesPerView={4}
            spaceBetween={12}
            navigation={{
              nextEl: '.wb-next',
              prevEl: '.wb-prev',
            }}
            // If you want the actual slider to move automatically too:
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              0: { slidesPerView: 1.2, spaceBetween: 10 },
              640: { slidesPerView: 2.5, spaceBetween: 12 },
              1024: { slidesPerView: 4, spaceBetween: 12 },
            }}
            className="watch-swiper"
          >
            {items.map((item) => (
              <SwiperSlide key={item.id}>
                <div className="relative aspect-[9/16] overflow-hidden bg-neutral-100 cursor-pointer group/item">
                  {item.isVideo ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105"
                      muted
                      loop
                      playsInline
                      autoPlay // Added this attribute
                      // Optional: Keep your hover logic if you want it to pause/play manually too
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt="Collection"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105"
                    />
                  )}

                  {/* Glass Play Icon - Only show if NOT autoplaying or as a decorative element */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-transform group-hover/item:scale-110">
                      <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Subtle Footer Tag */}
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="bg-black/60 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 backdrop-blur-sm">
                      {item.tag}
                    </span>
                  </div>

                  {/* "Shop Now" Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-end p-4 z-20">
                    <button className="w-full bg-white py-3 text-[11px] uppercase tracking-widest font-bold text-black border-none cursor-pointer">
                      Shop the Look
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows */}
          <button className="wb-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="wb-next absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .watch-swiper a, .watch-swiper button {
          text-decoration: none !important;
        }
        .watch-swiper .swiper-slide {
          height: auto;
        }
      `}</style>
    </section>
  );
};

export default WatchAndBuy;