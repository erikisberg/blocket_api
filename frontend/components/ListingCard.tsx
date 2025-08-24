'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImageSlider } from './ImageSlider'
import { AIAnalysisCard } from './AIAnalysisCard'
import { ExternalLink, MapPin, Calendar, User, Tag } from 'lucide-react'

interface Listing {
  ad: {
    ad_id: string
    subject: string
    body: string
    price: {
      value: number
      suffix: string
      old_value?: number
      price_lowered?: boolean
    }
    zipcode: string
    list_time: string
    ad_status: string
    images: Array<{
      url: string
      width: number
      height: number
      type: string
    }>
    advertiser: {
      name: string
      type: string
      public_profile?: {
        display_name: string
        reviews?: {
          overall_score: number
          worded_overall_score: string
        }
      }
    }
    category: Array<{
      id: string
      name: string
    }>
    location: Array<{
      name: string
      id: string
    }>
    share_url?: string
    parameter_groups?: Array<{
      parameters: Array<{
        value: string
      }>
    }>
  }
  discovered_at: string
  ai_analysis?: {
    score: number
    reasoning: string
    confidence: number
    factors: string[]
    recommendation: string
    analyzedAt: string
    model: string
  }
}

interface ListingCardProps {
  listing: Listing
}

export function ListingCard({ listing }: ListingCardProps) {
  const { ad } = listing
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
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
    return ad.category?.[ad.category.length - 1]?.name || 'Okänd kategori'
  }

  const getLocationName = () => {
    return ad.location?.[ad.location.length - 1]?.name || 'Okänd plats'
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{ad.subject}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {getCategoryName()}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {getLocationName()} ({ad.zipcode})
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(ad.list_time)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {formatPrice(ad.price.value)} {ad.price.suffix}
            </div>
            {ad.price.price_lowered && ad.price.old_value && (
              <div className="text-sm text-muted-foreground line-through">
                {formatPrice(ad.price.old_value)} {ad.price.suffix}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Image Slider */}
        <ImageSlider images={ad.images} title={ad.subject} />

        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">Beskrivning</h4>
          <p className="text-gray-700 leading-relaxed">{ad.body}</p>
        </div>



        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p><strong>Upptäckt:</strong> {formatDate(listing.discovered_at)}</p>
            {ad.list_time && (
              <p><strong>Skapad på Blocket:</strong> {formatDate(ad.list_time)}</p>
            )}
          </div>
          <div>
            <p><strong>Kategori:</strong> {getCategoryName()}</p>
            <p><strong>Säljare:</strong> {ad.advertiser.type === 'private' ? 'Företag' : 'Privat'}</p>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="border-t pt-6">
          <AIAnalysisCard 
            key={ad.ad_id}
            listing={{
              title: ad.subject,
              description: ad.body,
              price: ad.price.value,
              currency: ad.price.suffix,
              category: getCategoryName(),
              condition: ad.parameter_groups?.[0]?.parameters?.[0]?.value,
              images: ad.images?.map(img => ({ url: img.url })),
              location: getLocationName(),
              sellerType: ad.advertiser.type
            }}
            listingId={ad.ad_id}
            bevakningId="11998349"
            cachedAnalysis={listing.ai_analysis}
          />
        </div>

        {/* Seller Information */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Säljare</h4>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">
              {ad.advertiser.public_profile?.display_name || ad.advertiser.name}
            </span>
            <span className="text-sm text-muted-foreground">
              ({ad.advertiser.type === 'private' ? 'Privat' : 'Företag'})
            </span>
            {ad.advertiser.public_profile?.reviews && (
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                {ad.advertiser.public_profile.reviews.worded_overall_score} 
                ({ad.advertiser.public_profile.reviews.overall_score}/100)
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {ad.share_url && (
            <Button asChild>
              <a href={ad.share_url} target="_blank" rel="noopener noreferrer">
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
