import React from 'react';

const BannerSkeleton = () => {
  return (
    <div className="w-full px-4 md:px-0 animate-pulse">
      <div className="aspect-[21/9] md:aspect-[21/7] bg-neutral-100 rounded-[20px] md:rounded-0 w-full"></div>
    </div>
  );
};

export default BannerSkeleton;
