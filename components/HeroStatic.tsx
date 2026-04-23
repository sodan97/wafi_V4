
import React, { useState, useEffect, useRef } from 'react';

const HeroStatic: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 3000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsAnimating(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsAnimating(false), 3000);
  };

  return (
    <div
      className="relative w-full h-[45vh] rounded-3xl overflow-hidden shadow-2xl mb-12 border-8 border-white"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=2670&auto=format&fit=crop"
        alt="Wafi - Jouets éducatifs"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/75 via-purple-500/70 to-pink-500/75 flex flex-col justify-center items-center text-center p-4 md:p-6">
        <h1
          className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-6 drop-shadow-2xl leading-tight ${isAnimating ? 'animate-bounce' : ''}`}
          style={{ fontFamily: 'Comic Sans MS, cursive' }}
        >
          🎉 WAFI – Apprendre en jouant
        </h1>
        <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-white font-bold drop-shadow-lg max-w-3xl bg-yellow-400/30 px-4 md:px-6 py-2 md:py-3 rounded-full">
          Des jouets éducatifs pour éveiller l'intelligence et la créativité des enfants ✨
        </p>
      </div>
    </div>
  );
};

export default HeroStatic;
