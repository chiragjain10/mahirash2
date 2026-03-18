import React from 'react';

const ProductSkeleton = () => {
  return (
    <div className="bg-white min-h-screen animate-pulse">
      {/* Breadcrumb Skeleton */}
      <nav className="max-w-[1400px] mx-auto px-6 pt-8 pb-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-3 bg-neutral-100 rounded"></div>
          <div className="w-4 h-3 bg-neutral-100 rounded"></div>
          <div className="w-20 h-3 bg-neutral-100 rounded"></div>
          <div className="w-4 h-3 bg-neutral-100 rounded"></div>
          <div className="w-32 h-3 bg-neutral-100 rounded"></div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-32 pt-8">
        <div className="flex flex-col lg:flex-row gap-20 lg:gap-28 items-start">
          
          {/* Gallery Section Skeleton */}
          <div className="w-full lg:w-[55%] space-y-8">
            <div className="aspect-[4/5] bg-neutral-50 rounded-[64px]"></div>
            <div className="flex gap-5 justify-center lg:justify-start">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-28 h-28 bg-neutral-50 rounded-[32px]"></div>
              ))}
            </div>
          </div>

          {/* Info Section Skeleton */}
          <div className="w-full lg:w-[40%] space-y-12 pt-4">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-24 h-4 bg-neutral-100 rounded"></div>
                <div className="w-1 h-4 bg-neutral-100 rounded"></div>
                <div className="w-32 h-4 bg-neutral-100 rounded"></div>
              </div>
              
              <div className="space-y-4">
                <div className="w-full h-12 bg-neutral-100 rounded"></div>
                <div className="w-3/4 h-12 bg-neutral-100 rounded"></div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="w-32 h-10 bg-neutral-100 rounded"></div>
                <div className="w-24 h-6 bg-neutral-100 rounded"></div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="w-full h-px bg-neutral-100"></div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-neutral-50 rounded"></div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3 h-14">
                <div className="w-32 h-full bg-neutral-50 rounded"></div>
                <div className="flex-1 h-full bg-neutral-900/10 rounded"></div>
                <div className="w-14 h-full bg-neutral-50 rounded"></div>
              </div>
              <div className="w-full h-14 bg-[#640d14]/10 rounded"></div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
              <div className="flex justify-between gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-neutral-50 rounded-full"></div>
                    <div className="w-16 h-2 bg-neutral-50 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductSkeleton;
