import { NextRequest, NextResponse } from 'next/server'
import { analyzeListing, analyzeMultipleListings, ListingForAnalysis } from '@/lib/ai-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listing, multipleListings, listingId, bevakningId } = body

    if (multipleListings && Array.isArray(multipleListings)) {
      // Analyze multiple listings
      const results = await analyzeMultipleListings(multipleListings)
      return NextResponse.json({ success: true, results })
    } else if (listing) {
      // Analyze single listing
      const result = await analyzeListing(listing, listingId, bevakningId)
      return NextResponse.json({ success: true, result })
    } else {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('AI analysis API error:', error)
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    )
  }
}
