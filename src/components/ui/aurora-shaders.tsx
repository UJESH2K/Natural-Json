'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AuroraShadersProps extends React.HTMLAttributes<HTMLDivElement> {
  speed?: number;
  intensity?: number;
  vibrancy?: number;
  frequency?: number;
  stretch?: number;
}

export const AuroraShaders = forwardRef<HTMLDivElement, AuroraShadersProps>(({
  className,
  speed = 1.0,
  intensity = 1.0,
  vibrancy = 1.0,
  ...props
}, ref) => {
  const animationDuration = 20 / speed;

  return (
    <div
      ref={ref}
      className={cn('overflow-hidden', className)}
      {...props}
    >
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      {/* Aurora layer 1 - Purple/Blue base */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.5 * intensity,
          background: `
            radial-gradient(ellipse 80% 50% at 50% 100%, 
              rgba(120, 0, 255, 0.6) 0%, 
              transparent 50%),
            radial-gradient(ellipse 60% 40% at 30% 90%, 
              rgba(0, 150, 255, 0.5) 0%, 
              transparent 40%),
            radial-gradient(ellipse 70% 45% at 70% 95%, 
              rgba(255, 0, 150, 0.4) 0%, 
              transparent 45%)
          `,
          animation: `aurora-shift ${animationDuration}s ease-in-out infinite`,
        }}
      />
      
      {/* Aurora layer 2 - Moving wave */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.4 * vibrancy,
          background: `
            radial-gradient(ellipse 100% 60% at 40% 100%, 
              rgba(59, 130, 246, 0.6) 0%, 
              transparent 50%)
          `,
          animation: `aurora-wave ${animationDuration * 0.75}s ease-in-out infinite`,
        }}
      />
      
      {/* Aurora layer 3 - Counter wave */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.35 * vibrancy,
          background: `
            radial-gradient(ellipse 90% 50% at 60% 95%, 
              rgba(139, 92, 246, 0.5) 0%, 
              transparent 45%)
          `,
          animation: `aurora-wave ${animationDuration * 0.9}s ease-in-out infinite reverse`,
        }}
      />
      
      {/* Aurora layer 4 - Pink accent */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.3 * vibrancy,
          background: `
            radial-gradient(ellipse 70% 40% at 50% 105%, 
              rgba(236, 72, 153, 0.5) 0%, 
              transparent 40%)
          `,
          animation: `aurora-pulse ${animationDuration * 0.6}s ease-in-out infinite`,
        }}
      />

      {/* Floating particles effect */}
      <div 
        className="absolute inset-0"
        style={{
          opacity: 0.1,
          background: `
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 20%),
            radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.2) 0%, transparent 15%),
            radial-gradient(circle at 50% 90%, rgba(236, 72, 153, 0.25) 0%, transparent 18%)
          `,
          animation: `aurora-float ${animationDuration * 1.5}s ease-in-out infinite`,
        }}
      />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
});

AuroraShaders.displayName = 'AuroraShaders';
export default AuroraShaders;
