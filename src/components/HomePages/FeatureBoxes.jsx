import React from "react";
import {
  GiPerfumeBottle,
  GiRose,
  GiCrystalBall,
  GiSparkles,
} from "react-icons/gi";
import { MdLocalShipping } from "react-icons/md";
import { FaLeaf } from "react-icons/fa";

const PerfumeInfinityBanner = () => {
  const items = [
    { icon: <GiPerfumeBottle />, text: "Luxury Fragrance" },
    { icon: <GiRose />, text: "Handcrafted Perfume" },
    { icon: <GiSparkles />, text: "Signature Scents" },
    { icon: <MdLocalShipping />, text: "Fast Shipping" },
    { icon: <FaLeaf />, text: "Premium Ingredients" },
    { icon: <GiCrystalBall />, text: "Long Lasting Essence" },
  ];

  return (
    <div className="relative w-full overflow-hidden border-y border-neutral-100 bg-[#fff8f1]">

      {/* Edge gradient fade (luxury effect) */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-white to-transparent z-10"></div>

      <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused] py-3">

        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-4 mx-10 text-[#454545]"
          >
            <span className="text-xl">{item.icon}</span>

            <span className="text-[14px] font-medium uppercase tracking-[0.3em]">
              {item.text}
            </span>

            <span className="opacity-30 text-lg">|</span>
          </div>
        ))}

      </div>
    </div>
  );
};

export default PerfumeInfinityBanner;