'use client'

import { useEffect, useState } from 'react'

interface Star {
  id: number
  left: number
  top: number
  animationDuration: number
  animationDelay: number
}

export default function Starfield() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDuration: 2 + Math.random() * 3,
      animationDelay: Math.random() * 2
    }))
    setStars(newStars)
  }, [])

  return (
    <div className="fixed inset-0 opacity-50 pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute w-px h-px bg-white rounded-full"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animation: `twinkle ${star.animationDuration}s infinite ${star.animationDelay}s`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
