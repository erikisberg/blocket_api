'use client'

import React, { useState, useEffect } from 'react'
import { ListingCard } from '@/components/ListingCard'
import { ListView } from '@/components/ListView'
import { ViewToggle } from '@/components/ViewToggle'
import { SettingsPanel } from '@/components/SettingsPanel'
import { BatchAnalysis } from '@/components/BatchAnalysis'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Search, Filter, Bike, Brain } from 'lucide-react'

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
    profit_analysis?: {
      estimated_repair_cost: string
      estimated_repair_time: string
      estimated_sale_price: string
      estimated_profit: string
      profit_margin_percent: string
      risk_level: string
      repair_items: string[]
      market_comparison: string
    }
  }
}

interface ListingsData {
  [bevakningId: string]: Listing[]
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [scoreFilter, setScoreFilter] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  useEffect(() => {
    // Load listings from the JSON file
    fetch('/api/listings')
      .then(res => res.json())
      .then((data: ListingsData) => {
        // Flatten all listings from all bevakningar
        const allListings = Object.values(data).flat()
        setListings(allListings)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading listings:', error)
        setLoading(false)
      })
  }, [])

  const filteredListings = listings.filter(listing => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
                         listing.ad.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.ad.body.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Price filter
    const matchesPrice = listing.ad.price.value >= priceRange[0] && 
                        listing.ad.price.value <= priceRange[1]
    
    // Score filter
    const matchesScore = scoreFilter === null || 
                        (listing.ai_analysis && listing.ai_analysis.score >= scoreFilter)
    
    // Date filter
    let matchesDate = true
    if (dateFilter !== 'all') {
      const discoveredDate = new Date(listing.discovered_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - discoveredDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays <= 1
          break
        case 'week':
          matchesDate = diffDays <= 7
          break
        case 'month':
          matchesDate = diffDays <= 30
          break
      }
    }
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || 
                          listing.ad.parameter_groups?.[0]?.parameters?.[0]?.value === categoryFilter
    
    return matchesSearch && matchesPrice && matchesScore && matchesDate && matchesCategory
  })

  const currentListing = filteredListings[currentIndex]

  const nextListing = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredListings.length)
  }

  const previousListing = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredListings.length) % filteredListings.length)
  }

  const goToListing = (index: number) => {
    setCurrentIndex(index)
  }

  const resetFilters = () => {
    setSearchTerm('')
    setPriceRange([0, 10000])
    setScoreFilter(null)
    setDateFilter('all')
    setCategoryFilter('all')
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bike className="h-12 w-12 mx-auto mb-4 animate-bounce" />
          <p className="text-lg">Laddar cyklar...</p>
        </div>
      </div>
    )
  }

  if (filteredListings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bike className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">Inga cyklar hittades</p>
          <p className="text-sm text-gray-500">Prova att ändra sökfiltren</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bike className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Blocket Bevakningar</h1>
                <p className="text-sm text-muted-foreground">
                  Cyklar säljes i Jämtland • {filteredListings.length} annonser
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ViewToggle 
                currentView={viewMode} 
                onViewChange={setViewMode} 
              />
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} av {filteredListings.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Sök bland annonser..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pris:</span>
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
                className="w-20 px-2 py-1 border rounded text-sm"
              />
            </div>

            {/* Score Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">AI Score:</span>
              <select
                value={scoreFilter || ''}
                onChange={(e) => setScoreFilter(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Alla scores</option>
                <option value="5">5 - Mycket undervärderat</option>
                <option value="4">4+ - Undervärderat</option>
                <option value="3">3+ - Rättvärderat</option>
                <option value="2">2+ - Övervärderat</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Datum:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">Alla datum</option>
                <option value="today">Idag</option>
                <option value="week">Senaste veckan</option>
                <option value="month">Senaste månaden</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Kategori:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="all">Alla kategorier</option>
                <option value="Tillbehör">Tillbehör</option>
                <option value="Övriga cyklar">Övriga cyklar</option>
                <option value="Barncyklar">Barncyklar</option>
                <option value="Damcyklar">Damcyklar</option>
                <option value="Herrcyklar">Herrcyklar</option>
                <option value="Mountainbike">Mountainbike</option>
              </select>
            </div>

            {/* Reset Button */}
            <Button
              onClick={resetFilters}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Återställ filter
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={previousListing}
            disabled={filteredListings.length <= 1}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Föregående
          </Button>
          
          <Button
            onClick={nextListing}
            disabled={filteredListings.length <= 1}
            variant="outline"
          >
            Nästa
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Current Listing or List View */}
        {viewMode === 'cards' ? (
          currentListing && <ListingCard listing={currentListing} />
        ) : (
          <div className="mb-8">
            <ListView 
              listings={filteredListings} 
              onListingClick={(listing) => {
                const index = filteredListings.findIndex(l => l.ad.ad_id === listing.ad.ad_id)
                if (index !== -1) {
                  setCurrentIndex(index)
                  setViewMode('cards')
                }
              }} 
            />
          </div>
        )}

        {/* Thumbnail Navigation */}
        {filteredListings.length > 1 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Alla annonser</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredListings.map((listing, index) => (
                <button
                  key={listing.ad.ad_id}
                  onClick={() => goToListing(index)}
                  className={`
                    text-left p-3 border rounded-lg transition-all hover:shadow-md bg-white
                    ${currentIndex === index 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {/* Image */}
                  {listing.ad.images && listing.ad.images.length > 0 && (
                    <div className="relative mb-2">
                                             <img
                         src={listing.ad.images[0].url.split('?')[0]}
                         alt={listing.ad.subject}
                         className="w-full h-24 object-cover rounded"
                         loading="lazy"
                       />
                      
                      {/* AI Score Badge */}
                      {listing.ai_analysis && (
                        <div className="absolute top-1 right-1">
                          <div className={`px-2 py-1 rounded-full text-white font-bold text-xs ${
                            listing.ai_analysis.score === 5 ? 'bg-red-500' :
                            listing.ai_analysis.score === 4 ? 'bg-orange-500' :
                            listing.ai_analysis.score === 3 ? 'bg-yellow-500' :
                            listing.ai_analysis.score === 2 ? 'bg-blue-500' :
                            'bg-gray-500'
                          }`}>
                            {listing.ai_analysis.score}/5
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Title */}
                  <p className="text-sm font-medium line-clamp-2 mb-2 text-gray-900">
                    {listing.ad.subject}
                  </p>
                  
                  {/* Price */}
                  <p className="text-lg font-bold text-primary mb-2">
                    {listing.ad.price.value} {listing.ad.price.suffix}
                  </p>
                  
                  {/* Location and Date */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="flex items-center gap-1">
                      <span>📍</span>
                      {listing.ad.location?.[0]?.name || listing.ad.zipcode || 'Okänd plats'}
                    </p>
                    
                    {/* Discovery Date */}
                    <p className="flex items-center gap-1">
                      <span>🔍</span>
                      Upptäckt: {new Date(listing.discovered_at).toLocaleDateString('sv-SE')}
                    </p>
                    
                    {/* Blocket Creation Date */}
                    {listing.ad.list_time && (
                      <p className="flex items-center gap-1">
                        <span>📅</span>
                        Skapad: {new Date(listing.ad.list_time).toLocaleDateString('sv-SE')}
                      </p>
                    )}
                  </div>
                  
                  {/* AI Analysis Preview */}
                  {listing.ai_analysis && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        AI: {listing.ai_analysis.score === 5 ? 'Mycket undervärderat' :
                              listing.ai_analysis.score === 4 ? 'Undervärderat' :
                              listing.ai_analysis.score === 3 ? 'Rättvärderat' :
                              listing.ai_analysis.score === 2 ? 'Övervärderat' :
                              'Ej bedömt'}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {listing.ai_analysis.reasoning}
                      </p>
                      
                      {/* Profit Analysis Preview */}
                      {listing.ai_analysis.profit_analysis && (
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div>
                              <span className="text-gray-500">Kostnad:</span>
                              <p className="text-green-700 font-medium">{listing.ai_analysis.profit_analysis.estimated_repair_cost}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Vinst:</span>
                              <p className="text-green-700 font-medium">{listing.ai_analysis.profit_analysis.estimated_profit}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Risk:</span>
                              <span className={`ml-1 px-1 py-0.5 rounded-full text-xs font-medium ${
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Inställningar</h2>
            <p className="text-lg text-gray-600">
              Konfigurera SMS-notifikationer och AI-analys
            </p>
          </div>
          
          <SettingsPanel />
        </div>

        {/* AI Batch Analysis */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-purple-600" />
            <h2 className="text-3xl font-bold mb-2">AI-värderingsanalys</h2>
            <p className="text-lg text-gray-600">
              Låt AI:n analysera alla annonser för att hitta potentiellt undervärderade objekt
            </p>
          </div>
          
          <BatchAnalysis 
            listings={filteredListings.map(listing => ({
              title: listing.ad.subject,
              description: listing.ad.body,
              price: listing.ad.price.value,
              currency: listing.ad.price.suffix,
              category: listing.ad.category?.[listing.ad.category.length - 1]?.name || 'Okänd kategori',
              condition: listing.ad.parameter_groups?.[0]?.parameters?.[0]?.value,
              images: listing.ad.images?.map(img => ({ url: img.url })),
              location: listing.ad.location?.[listing.ad.location.length - 1]?.name || 'Okänd plats',
              sellerType: listing.ad.advertiser.type
            }))}
          />
        </div>
      </main>
    </div>
  )
}
