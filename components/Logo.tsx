import React from 'react';

// Seul endroit où le logo est défini : pour changer de logo, remplacer /logo.webp
const Logo: React.FC<{ className?: string }> = ({ className = 'h-11 w-auto' }) => (
  <img src="/logo.webp" alt="WAFI - Apprendre en jouant" className={`${className} object-contain`} width={229} height={160} />
);

export default Logo;
