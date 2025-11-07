import React from 'react'

interface CloudProps {
  className?: string
  size?: number
}

export function Cloud({ className = '', size = 120 }: CloudProps) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M90 36C90 28.268 83.732 22 76 22C75.131 22 74.282 22.082 73.456 22.238C70.632 13.696 62.451 8 53 8C41.402 8 32 17.402 32 29C32 29.351 32.011 29.699 32.033 30.045C25.308 31.643 20 37.71 20 45C20 53.284 26.716 60 35 60H85C96.046 60 105 51.046 105 40C105 37.395 104.462 36.895 103.455 34.455C100.632 31.696 96.451 30 92 30C91.294 30 90.606 30.065 89.938 30.189C89.978 29.796 90 29.4 90 29C90 21.268 90 36 90 36Z"
        fill="currentColor"
        stroke="#383838"
        strokeWidth="2"
      />
    </svg>
  )
}
