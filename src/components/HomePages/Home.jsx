import React, { Suspense, lazy, useEffect, useState } from "react";
import Preloader from "../Preloader";
import { usePreloader } from "../../context/PreloaderContext";
import BannerSlider from "./Bannerslider.jsx";
import Collections from "./Collections";
import FeaturesSlider from "./FeatureBoxes";
import BestSellers from "./BestSellers";
import NewArrivals from "./NewArrivals";
import BannerImg from "./BannerImg";
import BannerFresh from "./BannerFresh";
import Collection2 from "./Collection2";
import QuickView from "../QuickView";
import VideoBnr from "./VIdeoBnr.jsx";
import SizeGallery from "./Size.jsx";
import HeroSkeleton from "./HeroSkeleton";
import { Link } from 'react-router-dom';

// Lazy load heavy components
const Testimonials = lazy(() => import("./Testimonials"));
const VideoBanner = lazy(() => import("./Video"));
const FullScreenBanner = lazy(() => import("./FullBanner.jsx"));

import { db } from "../firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const ShopByCategoriesMobile = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const docRef = doc(db, 'metadata', 'lists');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const catList = docSnap.data().categories || [];
          // Map category names to a consistent structure
          // For images, we use a mapping or default placeholder
          const mapped = catList.map((name, index) => ({
            name,
            image: `images/p (${(index % 10) + 1}).png` // Cycle through available images
          }));
          setCategories(mapped);
        }
      } catch (e) {
        console.error("Error fetching categories:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading || categories.length === 0) return null;

  return (
    <section className="pt-20 pb-10 bg-white lg:hidden overflow-hidden">
      <div className="container px-4">
        <h2 className="text-xl font-light text-[#454545] uppercase tracking-[0.2em] text-center mb-8">
          Shop By Categories
        </h2>
        <Swiper
          modules={[Autoplay, Pagination]}
          slidesPerView={3}
          spaceBetween={20}
          autoplay={{ delay: 3000 }}
          className="pb-10"
        >
          {categories.map((cat) => (
            <SwiperSlide key={cat.name}>
              <Link 
                to={`/category?type=${cat.name.toLowerCase()}`}
                className="flex flex-col items-center group"
              >
                <div className="w-full aspect-square rounded-full overflow-hidden mb-3 bg-[#f5f5f5] border border-neutral-100">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="text-[9px] uppercase tracking-[0.1em] text-[#454545] font-medium text-center">
                  {cat.name}
                </span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

const Home = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isLoading } = usePreloader();

  const handleQuickView = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseQuickView = () => {
    setSelectedProduct(null);
  };

  return (
    <div>
      {isLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(255,255,255,1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Preloader />
        </div>
      )}
      <div className="">
        <div id="wrapper">
          <div className="">
            <Suspense fallback={<HeroSkeleton />}>
              <VideoBanner />
            </Suspense>
            {/* <BannerSlider /> */}
            <FeaturesSlider />
            <ShopByCategoriesMobile />
            <NewArrivals onQuickView={handleQuickView} />
            {/* <Suspense fallback={<div className="loading-placeholder" style={{height: '200px', background: '#f5f5f5'}}></div>}>
              <VideoBanner />
            </Suspense> */}
            <VideoBnr />
            <BestSellers onQuickView={handleQuickView} />
            <Suspense fallback={<div className="loading-placeholder" style={{ height: '100px', background: '#f5f5f5' }}></div>}>
              <FullScreenBanner />
            </Suspense>
            <Collections />
            <BannerImg />
            <SizeGallery />
            <BannerFresh onQuickView={handleQuickView} />
            <Collection2 />
            <Suspense fallback={<div className="loading-placeholder" style={{ height: '300px', background: '#f5f5f5' }}></div>}>
              <Testimonials />
            </Suspense>
          </div>
        </div>
      </div>

      {/* QuickView Modal - Rendered at root level */}
      {selectedProduct && (
        <QuickView
          product={selectedProduct}
          onClose={handleCloseQuickView}
        />
      )}
    </div>
  );
}

export default Home;
