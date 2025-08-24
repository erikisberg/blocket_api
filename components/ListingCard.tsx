'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageSlider } from './ImageSlider'
import { AIAnalysisCard } from './AIAnalysisCard'
import { ExternalLink, MapPin, Calendar, User, Tag } from 'lucide-react'

interface Listing {
  id: string
  bevakning_id: string
  ad_id: string
  title: string
  price: number
  currency: string
  description?: string
  category?: string
  condition?: string
  location?: string
  seller_type?: string
  blocket_url?: string
  frontend_url?: string
  discovered_at: string | Date
  ai_score?: number
  ai_confidence?: number
  ai_reasoning?: string
  ai_factors?: string[]
  ai_recommendation?: string
  ai_analyzed_at?: string | Date
  ai_model?: string
  created_at: string | Date
  updated_at: string | Date
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('sv-SE')
  }

  const getCategoryName = () => {
    return listing.category || 'Okänd kategori'
  }

  const getLocationName = () => {
    return listing.location || 'Okänd plats'
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {getCategoryName()}
              </div>
                              <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {getLocationName()}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(listing.discovered_at)}
                </div>
            </div>
          </div>
          
                      <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {formatPrice(listing.price)} {listing.currency}
              </div>
            </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Image Placeholder */}
        <div className="mb-6">
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg text-gray-500">Blocket Annons</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">Beskrivning</h4>
          <p className="text-gray-700 leading-relaxed">{listing.description || 'Ingen beskrivning tillgänglig'}</p>
        </div>



        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p><strong>Upptäckt:</strong> {formatDate(listing.discovered_at)}</p>
            {listing.ai_analyzed_at && (
              <p><strong>AI-analyserad:</strong> {formatDate(listing.ai_analyzed_at)}</p>
            )}
          </div>
          <div>
            <p><strong>Kategori:</strong> {getCategoryName()}</p>
            <p><strong>Säljare:</strong> {listing.seller_type === 'private' ? 'Företag' : 'Privat'}</p>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="border-t pt-6">
          <AIAnalysisCard 
            key={listing.ad_id}
            listing={{
              title: listing.title,
              description: listing.description || '',
              price: listing.price,
              currency: listing.currency,
              category: getCategoryName(),
              condition: listing.condition || 'Okänt',
              images: [],
              location: getLocationName(),
              sellerType: listing.seller_type || 'Okänd'
            }}
            listingId={listing.ad_id}
            bevakningId={listing.bevakning_id}
            cachedAnalysis={listing.ai_score ? {
              score: listing.ai_score,
              reasoning: listing.ai_reasoning || '',
              confidence: listing.ai_confidence || 0,
              factors: listing.ai_factors || [],
              recommendation: listing.ai_recommendation || '',
              analyzedAt: listing.ai_analyzed_at ? 
                (typeof listing.ai_analyzed_at === 'string' ? listing.ai_analyzed_at : listing.ai_analyzed_at.toISOString()) : '',
              model: listing.ai_model || ''
            } : undefined}
          />
        </div>

        {/* Seller Information */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Säljare</h4>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {listing.seller_type || 'Okänd säljare'}
            </span>
            <span className="text-sm text-muted-foreground">
              ({listing.seller_type === 'private' ? 'Privat' : 'Företag'})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {listing.blocket_url && (
            <Button asChild>
              <a href={listing.blocket_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visa på Blocket
              </a>
            </Button>
          )}
          <Button variant="outline" disabled>
            Kontakta säljare
          </Button>
        </div>




      </CardContent>
    </Card>
  )
}
