'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Calendar, MapPin, User, TrendingUp } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'

interface ListViewProps {
  listings: any[]
  onListingClick: (listing: any) => void
}

export function ListView({ listings, onListingClick }: ListViewProps) {
  const getLocationName = (ad: any) => {
    return ad.location?.[0]?.name || 'Okänd plats'
  }

  const getCategoryName = (ad: any) => {
    return ad.category?.[0]?.name || 'Okänd kategori'
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
        const ad = listing.ad
        return (
          <Card 
            key={ad.ad_id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onListingClick(listing)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Left side - Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    {ad.images && ad.images.length > 0 && (
                      <div className="flex-shrink-0">
                        <img 
                          src={ad.images[0].url.split('?')[0]} 
                          alt={ad.subject}
                          className="w-16 h-16 object-cover rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate mb-1">
                        {ad.subject}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getLocationName(ad)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(ad.list_time)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {ad.advertiser.type === 'private' ? 'Privat' : 'Företag'}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 line-clamp-2">
                        {ad.body}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side - Price and AI Score */}
                <div className="flex flex-col items-end gap-3 ml-4">
                  {/* Price */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(ad.price.value)} {ad.price.suffix}
                    </div>
                    {ad.price.price_lowered && ad.price.old_value && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(ad.price.old_value)} {ad.price.suffix}
                      </div>
                    )}
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
                    {ad.share_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={ad.share_url} 
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
              {listing.ai_analysis && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Analys</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {listing.ai_analysis.reasoning}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {listing.ai_analysis.factors.slice(0, 3).map((factor: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {factor}
                      </span>
                    ))}
                    {listing.ai_analysis.factors.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{listing.ai_analysis.factors.length - 3} fler
                      </span>
                    )}
                  </div>
                  
                  {/* Profit Analysis Preview */}
                  {listing.ai_analysis.profit_analysis && (
                    <div className="mt-3 pt-3 border-t border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Vinstanalys</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Kostnad:</span>
                          <p className="font-medium text-green-700">{listing.ai_analysis.profit_analysis.estimated_repair_cost}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vinst:</span>
                          <p className="font-medium text-green-700">{listing.ai_analysis.profit_analysis.estimated_profit}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Risk:</span>
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            listing.ai_analysis.profit_analysis.risk_level === 'Låg' ? 'bg-green-100 text-green-800' :
                            listing.ai_analysis.profit_analysis.risk_level === 'Medel' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.ai_analysis.profit_analysis.risk_level}
                          </span>
                        </div>
                      </div>
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
