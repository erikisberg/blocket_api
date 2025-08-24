'use client'

import React, { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react'
import { Button } from './ui/button'

interface Image {
  url: string
  description?: string
  thumbnail_url?: string
}

interface ImageSliderProps {
  images: Image[]
  title: string
  onClose?: () => void
}

export default function ImageSlider({ images, title, onClose }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setIsZoomed(false)
    setZoomLevel(1)
  }, [images.length])

  const prevImage = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsZoomed(false)
    setZoomLevel(1)
  }, [images.length])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
        nextImage()
        break
      case 'ArrowLeft':
        prevImage()
        break
      case 'Escape':
        onClose?.()
        break
      case '=':
      case '+':
        e.preventDefault()
        setZoomLevel(prev => Math.min(prev + 0.5, 3))
        break
      case '-':
        e.preventDefault()
        setZoomLevel(prev => Math.max(prev - 0.5, 0.5))
        break
    }
  }, [nextImage, prevImage, onClose])

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Inga bilder tillgängliga</p>
      </div>
    )
  }

  const currentImage = images[currentIndex]
  
  // Get high-quality image URL
  const getHighQualityUrl = (url: string) => {
    if (url.includes('blocketcdn.se')) {
      // Add original quality parameter for Blocket images
      if (url.includes('?type=original')) {
        return url
      }
      return url.includes('?') ? `${url}&type=original` : `${url}?type=original`
    }
    return url
  }

  const highQualityUrl = getHighQualityUrl(currentImage.url)

  return (
    <div className="relative group">
      {/* Main Image Container */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <div 
          className={`transition-all duration-200 ease-in-out ${
            isZoomed ? 'cursor-move' : 'cursor-zoom-in'
          }`}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={highQualityUrl}
            alt={currentImage.description || `Bild för ${title}`}
            className="w-full h-auto object-contain max-h-96"
            draggable={false}
            onClick={() => !isZoomed && setIsZoomed(true)}
          />
        </div>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0"
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0"
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 bg-black/20 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} av {images.length}
          </div>
        )}

        {/* Close Button (if modal) */}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 bg-black/20 hover:bg-black/40 text-white h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsZoomed(false)
                setZoomLevel(1)
              }}
              className={`flex-shrink-0 transition-all duration-200 ${
                index === currentIndex
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : 'hover:opacity-80'
              }`}
            >
              <img
                src={getHighQualityUrl(image.thumbnail_url || image.url)}
                alt={`Miniatyr ${index + 1}`}
                className="w-16 h-16 object-cover rounded border border-gray-200"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Info */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        <span className="hidden sm:inline">
          Piltangenter för navigation • +/- för zoom • ESC för att stänga
        </span>
      </div>
    </div>
  )
}
