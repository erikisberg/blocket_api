import { NextRequest, NextResponse } from 'next/server'
import { analyzeListing, ListingForAnalysis } from '../../../components/ai-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listings, chunkSize = 5, startIndex = 0 } = body

    if (!listings || !Array.isArray(listings)) {
      return NextResponse.json(
        { error: 'Invalid listings data' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing batch analysis: ${listings.length} listings, chunk size: ${chunkSize}, start: ${startIndex}`)

    // Process only a chunk of listings to avoid timeout
    const endIndex = Math.min(startIndex + chunkSize, listings.length)
    const currentChunk = listings.slice(startIndex, endIndex)
    
    console.log(`📊 Processing chunk ${startIndex + 1}-${endIndex} of ${listings.length}`)

    const results: any[] = []
    
    // Process current chunk
    for (const listing of currentChunk) {
      try {
        console.log(`🤖 Analyzing: ${listing.title}`)
        const result = await analyzeListing(listing)
        results.push({
          ...result,
          listingTitle: listing.title,
          success: true
        })
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`❌ Failed to analyze listing: ${listing.title}`, error)
        results.push({
          score: 3,
          reasoning: 'Analys misslyckades',
          confidence: 0,
          factors: ['Fel'],
          recommendation: 'Försök igen senare',
          profit_analysis: undefined,
          analyzedAt: new Date().toISOString(),
          model: 'claude-opus-4-1-20250805',
          listingTitle: listing.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const hasMore = endIndex < listings.length
    const nextChunk = hasMore ? endIndex : null

    console.log(`✅ Chunk completed: ${results.length} results, hasMore: ${hasMore}`)

    return NextResponse.json({
      success: true,
      results,
      progress: {
        completed: endIndex,
        total: listings.length,
        percentage: Math.round((endIndex / listings.length) * 100)
      },
      hasMore,
      nextChunk,
      message: `Processed ${results.length} listings (${startIndex + 1}-${endIndex} of ${listings.length})`
    })

  } catch (error) {
    console.error('Batch analysis API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Batch analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
