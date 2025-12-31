import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-16 h-16 border-4 border-culinary-gold border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-serif text-culinary-cream tracking-widest uppercase">{message}</h2>
      <p className="text-sm text-gray-400 mt-2 font-sans">Consulting the AI Chef...</p>
    </div>
  );
};

export default Loader;
