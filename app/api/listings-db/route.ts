import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '../../../components/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scoreFilter = searchParams.get('score')
    const dateFilter = searchParams.get('date')
    const categoryFilter = searchParams.get('category')
    
    // Get all listings from database
    const listings = await DatabaseService.getAllListings()
    
    if (!listings || !Array.isArray(listings)) {
      throw new Error('Invalid data received from database')
    }
    
    // Apply filters
    let filteredListings = listings
    
    // Score filter
    if (scoreFilter && scoreFilter !== 'all') {
      const minScore = parseInt(scoreFilter)
      filteredListings = filteredListings.filter(listing => 
        listing.ai_score && listing.ai_score >= minScore
      )
    }
    
    // Date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      let cutoffDate: Date
      
      switch (dateFilter) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        default:
          cutoffDate = new Date(0)
      }
      
      filteredListings = filteredListings.filter(listing => 
        new Date(listing.discovered_at) >= cutoffDate
      )
    }
    
    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filteredListings = filteredListings.filter(listing => 
        listing.category === categoryFilter
      )
    }
    
    // Sort by discovered_at (newest first)
          filteredListings.sort((a, b) => {
        try {
          const dateA = new Date(b.discovered_at).getTime()
          const dateB = new Date(a.discovered_at).getTime()
          return dateA - dateB
        } catch (error) {
          console.warn('Error sorting by date:', error)
          return 0
        }
      })
    
    return NextResponse.json({
      success: true,
      listings: filteredListings,
      total: filteredListings.length,
      filters: {
        score: scoreFilter,
        date: dateFilter,
        category: categoryFilter
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Failed to fetch listings from database:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch listings',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
