'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from './lib/utils'

interface ImageSliderProps {
  images: Array<{
    url: string
    width: number
    height: number
    type: string
  }>
  title: string
}

export function ImageSlider({ images, title }: ImageSliderProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Inga bilder tillgängliga</p>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Optimize image URL for better quality
  const getOptimizedImageUrl = (url: string, size: 'large' | 'medium' | 'small' = 'large') => {
    // If it's a Blocket image, try to get higher resolution
    if (url.includes('blocket.se') || url.includes('blocketcdn.com')) {
      // Remove any size parameters and get original
      return url.split('?')[0]
    }
    return url
  }

  return (
    <>
      <div className="relative w-full">
        {/* Main Image */}
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={getOptimizedImageUrl(images[currentImageIndex].url)}
            alt={`${title} - Bild ${currentImageIndex + 1}`}
            className="w-full h-full object-contain bg-white"
            loading="eager"
            onError={(e) => {
              // Fallback to original URL if optimized fails
              const target = e.target as HTMLImageElement
              target.src = images[currentImageIndex].url
            }}
          />
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={previousImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Zoom Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-lg"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          {/* Image Counter */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  "flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden bg-white",
                  currentImageIndex === index
                    ? "border-black shadow-lg"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <img
                  src={getOptimizedImageUrl(image.url, 'small')}
                  alt={`${title} - Miniatyr ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={toggleFullscreen}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={getOptimizedImageUrl(images[currentImageIndex].url)}
              alt={`${title} - Bild ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Close button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
            >
              ✕
            </Button>
            
            {/* Navigation in fullscreen */}
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); previousImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
