import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation } from 'swiper/modules';
import HeroSkeleton from './HeroSkeleton';

// Styles
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

const HeroVideo = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoUrls, setVideoUrls] = useState([]);
  const videoRefs = useRef(new Map()); // Using a Map for cleaner ref management

  useEffect(() => {
    const ref = doc(db, 'siteConfig', 'videos');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : {};
      const nextUrls = data?.heroVideoUrls || [];
      setVideoUrls(nextUrls);
    }, (error) => console.error('[Hero Video] Firestore Error:', error));

    return () => unsub();
  }, []);

  // Function to handle video playback on slide change
  const handleSlideChange = (swiper) => {
    const activeIndex = swiper.realIndex;
    
    // Play the current video, pause others
    videoRefs.current.forEach((video, index) => {
      if (index === activeIndex) {
        video.play().catch(err => console.log("Autoplay blocked or interrupted"));
      } else {
        video.pause();
      }
    });
  };

  if (videoUrls.length === 0) return <HeroSkeleton />;

  return (
    <div className="relative w-full">
      {!isLoaded && <HeroSkeleton />}
      
      <section className={`premium-hero ${isLoaded ? 'is-visible' : 'is-hidden'}`}>
        <div className="film-grain"></div>
        <div className="vignette"></div>

        <div className="video-frame">
          <Swiper
            modules={[Autoplay, EffectFade, Navigation]}
            effect="fade"
            speed={1000} // Smoother transition
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            loop={videoUrls.length > 1}
            navigation={videoUrls.length > 1}
            onSlideChange={handleSlideChange}
            className="h-full w-full"
          >
            {videoUrls.map((url, index) => (
              <SwiperSlide key={url}>
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                    else videoRefs.current.delete(index);
                  }}
                  className="hero-video-element"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedData={() => {
                    if (index === 0) setIsLoaded(true);
                  }}
                  src={url}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="edge-accent top"></div>
        <div className="edge-accent bottom"></div>

        <style jsx>{`
          .premium-hero {
            position: relative;
            width: 100%;
            height: 55vh;
            overflow: hidden;
            background: #000;
            transition: opacity 1s ease-in-out;
          }
          .is-hidden { opacity: 0; }
          .is-visible { opacity: 1; }
          
          .video-frame {
            width: 100%;
            height: 100%;
          }
          .hero-video-element {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          /* Ensuring Swiper buttons are visible over the video */
          :global(.swiper-button-next),
          :global(.swiper-button-prev) {
            color: #fff !important;
            filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
          }

          @media (max-width: 768px) {
            .premium-hero { height: 70vh; }
          }
        `}</style>
      </section>
    </div>
  );
};

export default HeroVideo;