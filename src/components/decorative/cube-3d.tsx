import React from 'react'

interface Cube3DProps {
  className?: string
  size?: number
}

export function Cube3D({ className = '', size = 100 }: Cube3DProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top face */}
      <path
        d="M50 10L85 30L50 50L15 30L50 10Z"
        fill="currentColor"
        stroke="#383838"
        strokeWidth="2"
        strokeLinejoin="bevel"
      />
      {/* Left face */}
      <path
        d="M15 30L15 70L50 90L50 50L15 30Z"
        fill="currentColor"
        fillOpacity="0.7"
        stroke="#383838"
        strokeWidth="2"
        strokeLinejoin="bevel"
      />
      {/* Right face */}
      <path
        d="M50 50L50 90L85 70L85 30L50 50Z"
        fill="currentColor"
        fillOpacity="0.85"
        stroke="#383838"
        strokeWidth="2"
        strokeLinejoin="bevel"
      />
    </svg>
  )
}
