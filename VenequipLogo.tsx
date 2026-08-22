import React from 'react';

interface VenequipLogoProps {
  className?: string;
}

/**
 * Exact Vector Reproduction of the Official Consorcio de Cogestión Venequip Corporate Logo (RIF J404644865)
 * Matches the official provided branding image:
 * 1. Outer rounded black border frame
 * 2. Top header: "CONSORCIO DE COGESTIÓN" in bold black uppercase
 * 3. Amber/Orange bracketed frame [ Venequip ]
 * 4. Central bold "Venequip" typography
 * 5. Bottom RIF: "J404644865"
 */
export const VenequipLogo: React.FC<VenequipLogoProps> = ({ 
  className = "w-full max-w-[220px] h-auto" 
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src="/venequip-logo.svg"
        alt="Consorcio de Cogestión Venequip - J404644865"
        className="w-full h-auto object-contain block"
        loading="eager"
      />
    </div>
  );
};


