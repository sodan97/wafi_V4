
import React from 'react';

const HeroStatic: React.FC = () => {
  return (
    <div className="relative w-full h-[45vh] rounded-3xl overflow-hidden shadow-2xl mb-12 border-8 border-white">
      <img
        src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=2670&auto=format&fit=crop"
        alt="Wafi - Jouets éducatifs"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/75 via-purple-500/70 to-pink-500/75 flex flex-col justify-center items-center text-center p-6">
        <h1 className="text-6xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl animate-bounce" style={{fontFamily: 'Comic Sans MS, cursive'}}>
          🎉 WAFI – Apprendre en jouant
        </h1>
        <p className="text-2xl md:text-3xl text-white font-bold drop-shadow-lg max-w-3xl bg-yellow-400/30 px-6 py-3 rounded-full">
          Des jouets éducatifs pour éveiller l'intelligence et la créativité des enfants ✨
        </p>
      </div>
    </div>
  );
};

export default HeroStatic;
