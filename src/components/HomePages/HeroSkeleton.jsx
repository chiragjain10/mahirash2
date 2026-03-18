import React from 'react';

const HeroSkeleton = () => {
  return (
    <section className="premium-hero animate-pulse bg-neutral-900 overflow-hidden">
      {/* Skeleton overlay to simulate depth */}
      <div className="vignette opacity-50"></div>
      
      {/* Central focus skeleton */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="space-y-6 text-center">
          <div className="w-48 h-3 bg-white/5 rounded-full mx-auto"></div>
          <div className="w-96 h-12 bg-white/10 rounded-full mx-auto"></div>
          <div className="w-64 h-4 bg-white/5 rounded-full mx-auto"></div>
        </div>
      </div>

      {/* Edge accent skeletons */}
      <div className="edge-accent top bg-white/5 h-1"></div>
      <div className="edge-accent bottom bg-white/5 h-1"></div>

      <style jsx>{`
        .premium-hero {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #000;
        }
        @media (max-width: 768px) {
          .premium-hero {
            height: 70vh;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSkeleton;
