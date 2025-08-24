'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Calendar, MapPin, User, TrendingUp } from 'lucide-react'
import { formatPrice, formatDate } from './utils'

interface ListViewProps {
  listings: any[]
  onListingClick: (listing: any) => void
}

export function ListView({ listings, onListingClick }: ListViewProps) {
  const getLocationName = (listing: any) => {
    return listing.location || 'Okänd plats'
  }

  const getCategoryName = (listing: any) => {
    return listing.category || 'Okänd kategori'
  }

  const getScoreColor = (score: number) => {
    switch (score) {
      case 5: return 'bg-red-500 hover:bg-red-600'
      case 4: return 'bg-orange-500 hover:bg-orange-600'
      case 3: return 'bg-yellow-500 hover:bg-yellow-600'
      case 2: return 'bg-blue-500 hover:bg-blue-600'
      default: return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const getScoreText = (score: number) => {
    switch (score) {
      case 5: return 'Mycket undervärderat'
      case 4: return 'Undervärderat'
      case 3: return 'Rättvärderat'
      case 2: return 'Övervärderat'
      default: return 'Ej bedömt'
    }
  }

  return (
    <div className="space-y-3">
      {listings.map((listing) => {
        return (
          <Card 
            key={listing.ad_id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onListingClick(listing)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Left side - Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0].url}
                          alt={listing.images[0].description || 'Thumbnail'}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzMiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOUNBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CbG9ja2V0PC90ZXh0Pgo8L3N2Zz4K'
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">Blocket</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate mb-1">
                        {listing.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getLocationName(listing)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(listing.discovered_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {listing.seller_type === 'private' ? 'Privat' : 'Företag'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {listing.description || 'Ingen beskrivning tillgänglig'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Price and AI Score */}
                <div className="flex flex-col items-end gap-3 ml-4">
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(listing.price)} {listing.currency}
                    </div>
                  </div>

                  {/* AI Score */}
                  {listing.ai_analysis ? (
                    <div className="text-center">
                      <Badge className={`${getScoreColor(listing.ai_analysis.score)} text-white`}>
                        {listing.ai_analysis.score}/5
                      </Badge>
                      <p className="text-xs text-gray-600 mt-1 max-w-24">
                        {getScoreText(listing.ai_analysis.score)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Badge variant="outline" className="text-gray-500">
                        Ej analyserat
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {listing.blocket_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={listing.blocket_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation()
                      onListingClick(listing)
                    }}>
                      Visa detaljer
                    </Button>
                  </div>
                </div>
              </div>

              {/* AI Analysis Preview */}
              {listing.ai_score && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Analys</span>
                  </div>
                  {listing.ai_reasoning && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {listing.ai_reasoning}
                    </p>
                  )}
                  {listing.ai_factors && listing.ai_factors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {listing.ai_factors.slice(0, 3).map((factor: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {factor}
                        </span>
                      ))}
                      {listing.ai_factors.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{listing.ai_factors.length - 3} fler
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Discovery Info */}
              <div className="mt-3 pt-2 text-xs text-muted-foreground">
                Upptäckt: {formatDate(listing.discovered_at)}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
