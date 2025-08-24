'use client'

import React, { useState, useEffect } from 'react'
import { ListingCard } from '../components/ListingCard'
import { ListView } from '../components/ListView'
import { ViewToggle } from '../components/ViewToggle'
import { SettingsPanel } from '../components/SettingsPanel'
import { BatchAnalysis } from '../components/BatchAnalysis'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import ImageSlider from '../components/ImageSlider'
import { ChevronLeft, ChevronRight, Search, Filter, Bike, Brain, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '../components/utils'

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
  images?: Array<{
    url: string
    description?: string
    thumbnail_url?: string
  }>
  discovered_at: string | Date
  ai_score?: number
  ai_confidence?: number
  ai_reasoning?: string
  ai_factors?: string[]
  ai_recommendation?: string
  ai_analyzed_at?: string | Date
  ai_model?: string
  profit_analysis?: any
  created_at: string | Date
  updated_at: string | Date
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
  const [fetchingNew, setFetchingNew] = useState(false)

  useEffect(() => {
    // Load listings from database
    fetch('/api/listings-db')
      .then(res => res.json())
      .then((data) => {
        if (data.success) {
          setListings(data.listings)
        } else {
          console.error('Failed to load listings:', data.error)
        }
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
                         listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Price filter
    const matchesPrice = listing.price >= priceRange[0] && 
                        listing.price <= priceRange[1]
    
    // Score filter
    const matchesScore = scoreFilter === null || 
                        (listing.ai_score && listing.ai_score >= scoreFilter)
    
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
                          listing.category === categoryFilter
    
    return matchesSearch && matchesPrice && matchesScore && matchesDate && matchesCategory
  })

  const currentListing = filteredListings[currentIndex]

  const nextListing = () => {
    if (filteredListings.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredListings.length)
    }
  }

  const previousListing = () => {
    if (filteredListings.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + filteredListings.length) % filteredListings.length)
    }
  }

  const goToListing = (index: number) => {
    if (index >= 0 && index < filteredListings.length) {
      setCurrentIndex(index)
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setPriceRange([0, 10000])
    setScoreFilter(null)
    setDateFilter('all')
    setCategoryFilter('all')
    setCurrentIndex(0)
  }

  const updateAllImages = async () => {
    try {
      console.log('🖼️ Starting batch image update...')
      
      const response = await fetch('/api/update-all-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceUpdate: false })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ Batch image update completed:', result)
      
      // Reload listings to show updated images
      window.location.reload()
      
    } catch (error) {
      console.error('❌ Failed to update images:', error)
      alert('Kunde inte uppdatera bilder. Se konsolen för detaljer.')
    }
  }

  const fetchNewListings = async () => {
    try {
      setFetchingNew(true)
      console.log('🔄 Fetching new listings from Blocket...')

      const response = await fetch('/api/cron/monitor-bevakningar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'run_once' })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ New listings fetch completed:', result)

      if (result.success) {
        // Reload listings to show new ones
        window.location.reload()
      } else {
        throw new Error(result.error || 'Unknown error')
      }

    } catch (error) {
      console.error('❌ Failed to fetch new listings:', error)
      alert('Kunde inte hämta nya listings. Se konsolen för detaljer.')
    } finally {
      setFetchingNew(false)
    }
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

            {/* Update Images Button */}
            <Button
              onClick={updateAllImages}
              variant="outline"
              size="sm"
              className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              🖼️ Uppdatera alla bilder
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
          currentListing ? <ListingCard listing={currentListing} /> : (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen annons vald</p>
            </div>
          )
        ) : (
          <div className="mb-8">
            <ListView 
              listings={filteredListings} 
              onListingClick={(listing) => {
                const index = filteredListings.findIndex(l => l.ad_id === listing.ad_id)
                if (index !== -1) {
                  setCurrentIndex(index)
                  setViewMode('cards')
                } else {
                  console.warn('Listing not found in filtered list')
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
                  key={listing.ad_id}
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
                  <div className="relative mb-2">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0].url.includes('blocketcdn.se') ? 
                          `${listing.images[0].url}?type=original` : 
                          listing.images[0].url
                        }
                        alt={listing.images[0].description || 'Thumbnail'}
                        className="w-full h-24 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYgIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQ4IiB5PSI0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOUNBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CbG9ja2V0PC90ZXh0Pgo8L3N2Zz4K'
                        }}
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">Blocket</span>
                      </div>
                    )}
                    
                    {/* AI Score Badge */}
                    {listing.ai_score && (
                      <div className="absolute top-1 right-1">
                        <div className={`px-2 py-1 rounded-full text-white font-bold text-xs ${
                          listing.ai_score === 5 ? 'bg-red-500' :
                          listing.ai_score === 4 ? 'bg-orange-500' :
                          listing.ai_score === 3 ? 'bg-yellow-500' :
                          listing.ai_score === 2 ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}>
                          {listing.ai_score}/5
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <p className="text-sm font-medium line-clamp-2 mb-2 text-gray-900">
                    {listing.title}
                  </p>
                  
                  {/* Price */}
                  <p className="text-lg font-bold text-primary mb-2">
                    {listing.price} {listing.currency}
                  </p>
                  
                  {/* Location and Date */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="flex items-center gap-1">
                      <span>📍</span>
                      {listing.location || 'Okänd plats'}
                    </p>
                    
                    {/* Discovery Date */}
                    <p className="flex items-center gap-1">
                      <span>🔍</span>
                      Upptäckt: {formatDate(listing.discovered_at)}
                    </p>
                    
                    {/* AI Analysis Date */}
                    {listing.ai_analyzed_at && (
                      <p className="flex items-center gap-1">
                        <span>🤖</span>
                        Analyserad: {formatDate(listing.ai_analyzed_at)}
                      </p>
                    )}
                  </div>
                  
                  {/* AI Analysis Preview */}
                  {listing.ai_score && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        AI: {listing.ai_score === 5 ? 'Mycket undervärderat' :
                              listing.ai_score === 4 ? 'Undervärderat' :
                              listing.ai_score === 3 ? 'Rättvärderat' :
                              listing.ai_score === 2 ? 'Övervärderat' :
                              'Ej bedömt'}
                      </p>
                      {listing.ai_reasoning && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {listing.ai_reasoning}
                        </p>
                      )}
                      {/* Profit Analysis Preview */}
                      {listing.profit_analysis && (
                        <div className="mt-1 pt-1 border-t border-gray-50">
                          <p className="text-xs text-green-600 font-medium">
                            💰 Vinst: {listing.profit_analysis.estimated_profit}
                          </p>
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
              title: listing.title,
              description: listing.description || '',
              price: listing.price,
              currency: listing.currency,
              category: listing.category || 'Okänd kategori',
              condition: listing.condition || 'Okänt',
              images: listing.images || [], // Use images from database
              location: listing.location || 'Okänd plats',
              sellerType: listing.seller_type || 'Okänd',
              profit_analysis: listing.profit_analysis // Include profit analysis
            }))}
          />
        </div>

        {/* Fetch New Listings */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <div className="h-12 w-12 mx-auto mb-4 text-blue-600">🔄</div>
            <h2 className="text-3xl font-bold mb-2">Hämta nya listings</h2>
            <p className="text-lg text-gray-600">
              Hämta nya annonser från Blocket och kör automatisk AI-analys
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={fetchNewListings}
              className="px-8 py-3 text-lg"
              disabled={fetchingNew}
            >
              {fetchingNew ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Hämtar nya listings...
                </>
              ) : (
                <>
                  🔄 Hämta nya listings från Blocket
                </>
              )}
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              AI-analys körs automatiskt på nya listings
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
