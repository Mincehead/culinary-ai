import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-culinary-dark">
      {/* Base Image Layer - High quality fresh ingredients on wood */}
      <img 
        src="https://images.unsplash.com/photo-1543353071-873f17a7a088?q=80&w=2070&auto=format&fit=crop" 
        alt="Kitchen Background" 
        className="absolute w-full h-full object-cover opacity-70 scale-105"
      />
      
      {/* Cinematic Gradient Overlay - Lighter touch to let image show through */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60"></div>
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}></div>
    </div>
  );
};

export default Background;