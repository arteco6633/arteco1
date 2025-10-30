"use client"

import React from 'react'

interface BrandLoaderProps {
  width?: number // px
}

export default function BrandLoader({ width = 220 }: BrandLoaderProps) {
  const height = Math.round(width * (110 / 220))
  return (
    <div className="inline-block" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 220 110"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        {/* Серый фон референса */}
        <rect x="0" y="0" width="220" height="110" fill="#dcdcdc" />

        {/* Чёрный круг справа (за капсулой) */}
        <g className="bl__circle">
          <circle cx="170" cy="55" r="55" fill="#000000" />
        </g>

        {/* Белая капсула поверх круга */}
        <rect x="10" y="10" width="160" height="90" rx="45" fill="#ffffff" />

        {/* Чёрная «звезда» по центру капсулы с вогнутыми сторонами */}
        <g className="bl__star">
          <path
            d="M90 30
               Q 95 55 90 80
               Q 115 75 140 80
               Q 135 55 140 30
               Q 115 35 90 30 Z"
            fill="#1a1919"
          />
        </g>
      </svg>

      <style jsx>{`
        @keyframes blSlide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        @keyframes blPulse {
          0%, 100% { transform: translate(-2px,0) scale(1); opacity: 0.95; }
          50% { transform: translate(0,0) scale(1.06); opacity: 1; }
        }
        .bl__circle { animation: blSlide 1.6s ease-in-out infinite; }
        .bl__star { animation: blPulse 1.2s ease-in-out infinite; transform-origin: 110px 55px; }
      `}</style>
    </div>
  )
}


