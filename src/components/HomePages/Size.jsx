import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Link } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

function SizeGallery() {
  const getSizeFilterId = (range) => {
    switch (range) {
      case '< 10ml': return '1-10';
      case '10-20ml': return '10-20';
      case '20-50ml': return '20-50';
      case '50-100ml': return '50-100';
      case '>100ml': return '100+';
      default: return 'all';
    }
  };

  const sizes = [
    {
      src: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800',
      title: 'Discovery',
      range: '< 10ml',
      label: 'Travel Essentials'
    },
    {
      src: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=800',
      title: 'Petite',
      range: '20-50ml',
      label: 'Daily Companion'
    },
    {
      src: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800',
      title: 'Signature',
      range: '50-100ml',
      label: 'The Standard'
    },
    {
      // New 4th Image: Luxury Large Format Bottle
      src: 'https://images.unsplash.com/photo-1590735204423-d4444463428a?auto=format&fit=crop&q=80&w=800',
      title: 'Grand',
      range: '>100ml',
      label: 'Connoisseur'
    },
  ];

  return (
    <section className="py-5 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4">

        {/* Title Design - Strictly No Underlines / No Decoration */}
       
        <div className="mb-16">
          <span className="text-[10px] md:text-[12px] text-[#640d14] uppercase tracking-[0.4em] font-bold mb-3 block">Tailored Sizes</span>
          <h2 className="text-2xl md:text-4xl font-serif text-neutral-900 uppercase tracking-widest">Shop by Volume</h2>
        </div>

        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={4}
          spaceBetween={30}
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{ delay: 6000 }}
          breakpoints={{
            0: { slidesPerView: 1.2, spaceBetween: 20 },
            768: { slidesPerView: 2.5, spaceBetween: 30 },
            1024: { slidesPerView: 4, spaceBetween: 40 },
          }}
          className="pb-20 !overflow-visible"
        >
          {sizes.map((item, index) => (
            <SwiperSlide key={index}>
              <Link
                to={`/category?size=${getSizeFilterId(item.range)}`}
                className="group relative block no-underline outline-none decoration-0"
                style={{ textDecoration: 'none' }}
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                  />

                  {/* Minimal Floating Tag */}
                  <div className="absolute top-0 left-0 bg-white/90 backdrop-blur-sm px-4 py-2 text-[9px] font-bold tracking-[0.2em] text-neutral-900 uppercase">
                    {item.range}
                  </div>
                </div>

                {/* Content Block */}
                <div className="mt-8 text-center no-underline">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#640d14] font-semibold block mb-2 no-underline">
                    {item.label}
                  </span>
                  <h3 className="text-xl font-serif text-neutral-800 tracking-wide no-underline">
                    {item.title}
                  </h3>

                  {/* Interaction Text - Clean Fade Only */}
                  <div className="mt-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 opacity-0 group-hover:opacity-100 transition-all duration-700 inline-block no-underline">
                      Explore Series
                    </span>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        /* Force remove any browser-default underlines on Links */
        .no-underline, a, a:hover {
          text-decoration: none !important;
        }
        
        .swiper-pagination-bullet {
          background: #e5e5e5 !important;
          opacity: 1 !important;
          transition: all 0.4s ease;
        }
        .swiper-pagination-bullet-active {
          background: #640d14 !important;
          width: 30px !important;
          border-radius: 2px !important;
        }
      `}</style>
    </section>
  );
}

export default SizeGallery;