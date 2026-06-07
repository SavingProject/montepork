/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  light?: boolean;
}

export default function Logo({ size = "md", light = false }: LogoProps) {
  const sizeClasses = {
    sm: "text-2xl gap-0.5",
    md: "text-4xl gap-1",
    lg: "text-5xl md:text-6xl gap-1.5",
    xl: "text-6xl md:text-7xl lg:text-8xl gap-2",
  };

  const noseSizes = {
    sm: "w-6 h-6 border-2",
    md: "w-9 h-9 border-2",
    lg: "w-12 h-12 md:w-14 md:h-14 border-3",
    xl: "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-4",
  };

  return (
    <div
      id="brand-logo"
      className={`font-display font-black tracking-tighter text-white inline-flex items-center justify-center select-none ${sizeClasses[size]}`}
    >
      <span className="text-white">M</span>
      
      {/* Pig-Snout "O" */}
      <span
        style={{ backgroundColor: "#E8005A" }}
        className={`relative rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110 logo-pig-nose-glow border-white ${noseSizes[size]}`}
      >
        {/* Nostrils */}
        <span className="absolute left-[32%] w-[12%] h-[28%] bg-black rounded-full transform rotate-3 shadow-inner"></span>
        <span className="absolute right-[32%] w-[12%] h-[28%] bg-black rounded-full transform -rotate-3 shadow-inner"></span>
        
        {/* Snout bottom smile accent (cute detail) */}
        <span className="absolute bottom-[20%] w-[25%] h-[8%] bg-black/10 rounded-full"></span>
      </span>

      <span className="text-white">NTE</span>
      <span className="text-primary ml-1 font-extrabold uppercase" style={{ color: "#E8005A" }}>PORK</span>
    </div>
  );
}
