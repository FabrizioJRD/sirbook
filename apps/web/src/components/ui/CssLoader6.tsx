'use client';

import React from 'react';

interface CssLoader6Props {
  size?: number; // Tamaño base (48px por defecto)
  accentColor?: string; // Color del cubo activo (por defecto el verde de la interfaz)
  trackColor?: string; // Color de la base de bloques
  className?: string;
  variant?: 'cube' | 'wheel'; // 'cube' es el Loader 6 3D de part-1, 'wheel' de part-2
}

/**
 * Componente de Loader 6 basado en https://github.com/mPooja-15/css-loader-pm
 */
export function CssLoader6({
  size = 48,
  accentColor = '#00A82D',
  trackColor = '#D6D3D1',
  className = '',
  variant = 'cube',
}: CssLoader6Props) {
  const scale = size / 48;

  if (variant === 'wheel') {
    return (
      <div
        className={`css-loader-6-wheel ${className}`}
        style={
          {
            '--loader-accent': accentColor,
            transform: `scale(${scale})`,
          } as React.CSSProperties
        }
      />
    );
  }

  return (
    <div
      className="inline-flex items-center justify-center p-3"
      style={{
        width: `${size * 1.4}px`,
        height: `${size * 1.4}px`,
      }}
    >
      <div
        className={`css-loader-6 ${className}`}
        style={
          {
            '--loader-accent': accentColor,
            '--loader-track': trackColor,
            transform: `rotate(45deg) scale(${scale})`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/**
 * Pantalla completa de carga profesional para la interfaz de Sirbook
 */
export function LoadingScreen({
  message = 'Cargando...',
  submessage,
  accentColor = '#00A82D',
}: {
  message?: string;
  submessage?: string;
  accentColor?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F7F8] text-stone-700 font-sans select-none animate-in fade-in duration-200">
      <div className="flex flex-col items-center justify-center space-y-6 max-w-sm px-6 text-center">
        {/* Loader 6 Animado */}
        <div className="relative py-4 flex items-center justify-center">
          <CssLoader6 size={46} accentColor={accentColor} />
        </div>

        {/* Mensajes de Estado */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold tracking-tight text-stone-900">
            {message}
          </h3>
          {submessage && (
            <p className="text-xs text-stone-500 font-mono tracking-wide">
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CssLoader6;
