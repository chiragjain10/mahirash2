import React from 'react';

const SectionSkeleton = () => {
  return (
    <section className="py-20 bg-white overflow-hidden animate-pulse">
      <div className="px-4">
        {/* Header Skeleton */}
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-3">
            <div className="w-48 h-3 bg-neutral-100 rounded"></div>
            <div className="w-72 h-8 bg-neutral-100 rounded"></div>
          </div>
          <div className="w-32 h-4 bg-neutral-100 rounded"></div>
        </div>

        {/* Product Cards Slider Skeleton */}
        <div className="flex gap-8 overflow-hidden -mx-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-[300px] md:w-[340px] bg-white rounded-[40px] p-6 border border-neutral-50 space-y-6"
            >
              {/* Image Skeleton */}
              <div className="aspect-square rounded-3xl bg-neutral-50"></div>
              
              {/* Content Skeleton */}
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-2 bg-neutral-100 rounded"></div>
                  <div className="w-40 h-4 bg-neutral-100 rounded"></div>
                </div>
                
                <div className="pt-3 space-y-4">
                  <div className="flex justify-center gap-3">
                    <div className="w-16 h-4 bg-neutral-100 rounded"></div>
                    <div className="w-12 h-4 bg-neutral-50 rounded"></div>
                  </div>
                  
                  <div className="w-24 h-3 bg-neutral-100 mx-auto rounded"></div>
                  
                  <div className="flex justify-center gap-1.5">
                    {[1, 2].map((j) => (
                      <div key={j} className="w-10 h-4 bg-neutral-50 rounded-full"></div>
                    ))}
                  </div>
                  
                  {/* Button Skeleton */}
                  <div className="w-full h-12 bg-neutral-100 rounded-2xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionSkeleton;
