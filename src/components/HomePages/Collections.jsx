import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

function Collections() {
  const items = [
    { src: 'images/p (7).png', title: 'Woody', category: 'Warm & Earthy' },
    { src: 'images/p (9).png', title: 'Citrus', category: 'Fresh & Zesty' },
    { src: 'images/p (10).png', title: 'Flower', category: 'Delicate Floral' },
    { src: 'images/p (8).png', title: 'Aromatic', category: 'Spicy & Herbal' },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="max-w-[1400px] mx-auto px-4">
        
        {/* Title Design */}
        <div className="section-title" data-aos="fade-up">
          <span>Most Wanted</span>
          <h2>Our <span className="italic font-light">Collections</span></h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={4}
          spaceBetween={30}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          breakpoints={{
            0: { slidesPerView: 1.2, spaceBetween: 20 },
            640: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 30 },
            1200: { slidesPerView: 4, spaceBetween: 40 },
          }}
          className="pb-16"
        >
          {items.map((item, index) => (
            <SwiperSlide key={index} className="h-full">
              <Link
                to={{
                  pathname: `/category/${encodeURIComponent(item.title)}`,
                  search: `?note=${encodeURIComponent(item.title)}`
                }}
                className="group relative block w-full aspect-[3/4] overflow-hidden bg-[#f5f5f5]"
              >
                {/* Image Wrapper */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.src} 
                    alt={item.title} 
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                  />
                  {/* Very Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 text-white">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-neutral-200 mb-2 opacity-0 transition-all duration-500 group-hover:opacity-100">
                    {item.category}
                  </p>
                  <h3 className="text-xl font-light tracking-[0.2em] uppercase mb-4">
                    {item.title}
                  </h3>
                  
                  {/* Minimalist Link */}
                  <div className="overflow-hidden">
                    <span className="inline-block text-[10px] uppercase tracking-[0.2em] border-b border-white/70 pb-1 transform -translate-x-full transition-transform duration-500 group-hover:translate-x-0">
                      Explore Collection
                    </span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom Swiper Pagination Styling */}
      <style jsx global>{`
        .swiper-pagination-bullet-active {
          background: #454545 !important;
          width: 12px !important;
          border-radius: 6px !important;
        }
        .swiper-pagination-bullet {
          background: #e0e0e0;
          opacity: 1;
        }
      `}</style>
    </section>
  );
}

export default Collections;