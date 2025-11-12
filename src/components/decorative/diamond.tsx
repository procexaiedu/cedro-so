import React from 'react'

interface DiamondProps {
  className?: string
  size?: number
}

export function Diamond({ className = '', size = 80 }: DiamondProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer diamond */}
      <path
        d="M40 2L78 40L40 78L2 40L40 2Z"
        fill="currentColor"
        stroke="#383838"
        strokeWidth="2"
      />
      {/* Inner facets */}
      <path
        d="M40 2L40 78M2 40L78 40"
        stroke="#383838"
        strokeWidth="2"
      />
      <path
        d="M14 14L66 66M66 14L14 66"
        stroke="#383838"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  )
}
